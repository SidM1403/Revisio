import OpenAI from 'openai';
import { z } from 'zod';


const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
});

const PptSchema = z.object({
  slides: z.array(z.object({
    title: z.string(),
    bullets: z.array(z.string()),
    speakerNote: z.string().optional()
  }))
});

import { currentUser } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    const user = await currentUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    
    const isPremium = user.publicMetadata?.isPremium === true;
    if (!isPremium) {
      return Response.json({ error: 'Premium subscription required.' }, { status: 403 });
    }

    const { text, numSlides = 5 } = await req.json();

    if (!process.env.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not set in .env.local");
    }

    const response = await openai.chat.completions.create({
      model: "nvidia/nemotron-3-super-120b-a12b:free",
      messages: [
        { 
          role: "system", 
          content: `You are an expert presentation creator. Create a presentation with exactly ${numSlides} slides based on the input text.
Return ONLY a valid JSON object matching this schema. Do not output markdown codeblocks around the JSON.
Schema:
{
  "slides": [
    {
      "title": "Slide Title",
      "bullets": ["Bullet 1", "Bullet 2", "Bullet 3"],
      "speakerNote": "Optional speaker notes"
    }
  ]
}` 
        },
        { role: "user", content: `Create a presentation based on this text:\n\n${text}` }
      ],
      response_format: { type: "json_object" } // Tell the AI to output JSON
    }).catch(async (err) => {
      console.warn("Primary model failed, trying fallback...", err.message);
      // Fallback to another free model if the first one is down
      return await openai.chat.completions.create({
        model: "google/gemini-pro-1.5-exp:free",
        messages: [
          { role: "system", content: "Create a slide presentation in JSON format." },
          { role: "user", content: `Text: ${text}\nSlides: ${numSlides}\nSchema: {slides:[{title,bullets,speakerNote}]}` }
        ],
        response_format: { type: "json_object" }
      });
    });

    let content = response.choices[0]?.message?.content || "{}";
    
    // Robust JSON extraction
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      content = jsonMatch[0];
    }

    try {
      const parsedJson = JSON.parse(content);
      const ppt = PptSchema.parse(parsedJson);
      return Response.json(ppt);
    } catch (parseErr: any) {
      console.error("JSON Parse failed. Content was:", content);
      throw new Error(`AI returned invalid format: ${parseErr.message}`);
    }
  } catch (error: any) {
    console.error("PPT generation failed:", error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
