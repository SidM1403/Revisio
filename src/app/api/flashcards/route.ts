import OpenAI from 'openai';
import { z } from 'zod';

export const runtime = 'edge';

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const FlashcardSchema = z.object({
  cards: z.array(z.object({
    front: z.string(),
    back: z.string()
  }))
});

export async function POST(req: Request) {
  try {
    const { text, count = 10 } = await req.json();

    const response = await openai.chat.completions.create({
      model: "nvidia/nemotron-3-super-120b-a12b:free",
      messages: [
        { 
          role: "system", 
          content: `You are an expert flashcard creator. Generate exactly ${count} flashcards. 
Return ONLY a valid JSON object matching this schema. No markdown wrappers.
{
  "cards": [
    {
      "front": "Question or concept",
      "back": "Short answer or definition"
    }
  ]
}` 
        },
        { role: "user", content: `Create flashcards based on this text:\n\n${text}` }
      ]
    });

    let content = response.choices[0]?.message?.content || "{}";
    if (content.startsWith("```json")) content = content.replace(/^```json\n/, "").replace(/\n```$/, "");
    else if (content.startsWith("```")) content = content.replace(/^```\n/, "").replace(/\n```$/, "");

    const parsedJson = JSON.parse(content);
    const flashcards = FlashcardSchema.parse(parsedJson);

    return Response.json(flashcards.cards);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
