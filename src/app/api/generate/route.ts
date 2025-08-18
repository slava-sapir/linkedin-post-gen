// src/app/api/generate/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { title, prompt } = await req.json();

    // Guard
    if (!openai.apiKey) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY" },
        { status: 500 }
      );
    }

    const system = `You are a professional LinkedIn copywriter. 
- Write in a clear, helpful, human tone (no fluff).
- Keep it 100–220 words by default.
- Use 1–2 tasteful emojis max.
- Add 3–5 relevant hashtags on the last line.
- Prefer short paragraphs and bullets.
- Avoid cliched hooks, avoid over-selling.
- If a title is provided, use it as the post’s theme (not a heading).`;

    const user = `Title: ${title || "(none)"} 
Notes/Prompt: ${prompt || "(none)"}

Write a LinkedIn post for my personal profile.`;

    // You can switch models later; this is a cost‑effective default.
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      max_tokens: 600,
    });

    const text =
      completion.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I couldn’t generate text.";

    // Basic safety: LinkedIn cap ~3000 chars
    const LI_MAX = 3000;
    const clipped = text.length > LI_MAX ? text.slice(0, LI_MAX - 1) : text;

    return NextResponse.json({ post: clipped });
  } catch (err: any) {
    console.error("Generate error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed to generate" },
      { status: 500 }
    );
    }
}
