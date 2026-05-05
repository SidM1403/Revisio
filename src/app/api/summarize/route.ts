import OpenAI from 'openai';
import { Redis } from '@upstash/redis';

export const runtime = 'edge';

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://dummy.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'dummy',
});

export async function POST(req: Request) {
  try {
    const { text, level, persona = "standard" } = await req.json();

    const encoder = new TextEncoder();
    const data = encoder.encode(text + level + persona);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const cacheKey = `summary:${hashHex}`;

    const cachedSummary = await redis.get<string>(cacheKey);

    if (cachedSummary) {
      const readableStream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(cachedSummary));
          controller.close();
        }
      });
      return new Response(readableStream, {
        headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' },
      });
    }

    let detailPrompt = "a concise, bulleted summary";
    if (level === 'detailed') detailPrompt = "a highly detailed, comprehensive breakdown";
    if (level === 'exam') detailPrompt = "an exam-focused study guide highlighting key terms and formulas";

    let personaPrompt = "You are a helpful, expert AI tutor.";
    if (persona === 'eli5') personaPrompt = "You are an expert tutor. Explain the concepts so simply that a 10-year-old could understand them. Use very simple analogies and plain English.";
    if (persona === 'interview') personaPrompt = "You are a senior technical interviewer. Format the summary as a series of potential tough interview questions and perfect, professional answers based on the text.";

    const systemMessage = `${personaPrompt} Create ${detailPrompt} of the provided text. Use markdown formatting.`;

    const stream = await openai.chat.completions.create({
      model: "nvidia/nemotron-3-super-120b-a12b:free",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: text }
      ],
      stream: true,
    });

    let fullResponse = "";

    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            fullResponse += content;
            controller.enqueue(new TextEncoder().encode(content));
          }
        }
        controller.close();
        
        await redis.setex(cacheKey, 60 * 60 * 24 * 7, fullResponse); // Cache for 7 days
      }
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
