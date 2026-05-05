import OpenAI from 'openai';
import { z } from 'zod';

export const runtime = 'edge';

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const PlannerSchema = z.object({
  days: z.array(z.object({
    dayNumber: z.number(),
    title: z.string(),
    tasks: z.array(z.string()),
    estimatedMinutes: z.number()
  }))
});

export async function POST(req: Request) {
  try {
    const { text, durationDays = 7 } = await req.json();

    const response = await openai.chat.completions.create({
      model: "nvidia/nemotron-3-super-120b-a12b:free",
      messages: [
        { 
          role: "system", 
          content: `You are an expert study planner. Create a ${durationDays}-day study schedule based on the input text. Break the material into logical daily chunks.
Return ONLY a valid JSON object. No markdown wrappers.
Schema:
{
  "days": [
    {
      "dayNumber": 1,
      "title": "Topic for the day",
      "tasks": ["Task 1", "Task 2"],
      "estimatedMinutes": 45
    }
  ]
}` 
        },
        { role: "user", content: `Create a ${durationDays}-day study plan based on this text:\n\n${text}` }
      ]
    });

    let content = response.choices[0]?.message?.content || "{}";
    if (content.startsWith("```json")) content = content.replace(/^```json\n/, "").replace(/\n```$/, "");
    else if (content.startsWith("```")) content = content.replace(/^```\n/, "").replace(/\n```$/, "");

    const parsedJson = JSON.parse(content);
    const planner = PlannerSchema.parse(parsedJson);

    return Response.json(planner.days);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
