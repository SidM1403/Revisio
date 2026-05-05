import OpenAI from 'openai';
import { z } from 'zod';

export const runtime = 'edge';

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const QuizResponseSchema = z.object({
  questions: z.array(z.object({
    question: z.string(),
    options: z.array(z.string()).length(4),
    answer: z.number().min(0).max(3),
    explanation: z.string()
  }))
});

export async function POST(req: Request) {
  try {
    const { text, difficulty = "medium", count = 5 } = await req.json();

    const response = await openai.chat.completions.create({
      model: "nvidia/nemotron-3-super-120b-a12b:free",
      messages: [
        { 
          role: "system", 
          content: `You are an expert quiz generator. Generate exactly ${count} multiple choice questions. 
Return ONLY a valid JSON object with a "questions" array. No markdown formatting, no code blocks, no other text.
Schema:
{
  "questions": [
    {
      "question": "string",
      "options": ["string", "string", "string", "string"],
      "answer": number (0-3 representing the correct option index),
      "explanation": "string"
    }
  ]
}` 
        },
        { role: "user", content: `Generate a ${difficulty} difficulty quiz based on this text:\n\n${text}` }
      ]
    });

    let content = response.choices[0]?.message?.content || "{}";
    
    if (content.startsWith("```json")) {
      content = content.replace(/^```json\n/, "").replace(/\n```$/, "");
    } else if (content.startsWith("```")) {
      content = content.replace(/^```\n/, "").replace(/\n```$/, "");
    }

    const parsedJson = JSON.parse(content);
    const quiz = QuizResponseSchema.parse(parsedJson);

    return Response.json(quiz.questions);
  } catch (error: any) {
    console.error("Quiz generation failed:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
