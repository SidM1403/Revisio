import OpenAI from 'openai';
import { z } from 'zod';

export const runtime = 'edge';

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const MindMapNodeSchema: z.ZodType<any> = z.lazy(() => z.object({
  name: z.string(),
  children: z.array(MindMapNodeSchema).optional()
}));

const MindMapSchema = z.object({
  name: z.string(),
  children: z.array(MindMapNodeSchema)
});

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    const response = await openai.chat.completions.create({
      model: "nvidia/nemotron-3-super-120b-a12b:free",
      messages: [
        { 
          role: "system", 
          content: `You are an expert knowledge architect. Analyze the text and create a nested hierarchy of topics for a mind map.
Return ONLY a valid JSON object representing a tree structure. No markdown wrappers.
Schema:
{
  "name": "Main Core Topic",
  "children": [
    {
      "name": "Subtopic 1",
      "children": [
        { "name": "Detail 1" },
        { "name": "Detail 2" }
      ]
    }
  ]
}` 
        },
        { role: "user", content: `Create a mind map tree based on this text:\n\n${text}` }
      ]
    });

    let content = response.choices[0]?.message?.content || "{}";
    if (content.startsWith("```json")) content = content.replace(/^```json\n/, "").replace(/\n```$/, "");
    else if (content.startsWith("```")) content = content.replace(/^```\n/, "").replace(/\n```$/, "");

    const parsedJson = JSON.parse(content);
    const mindmap = MindMapSchema.parse(parsedJson);

    return Response.json(mindmap);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
