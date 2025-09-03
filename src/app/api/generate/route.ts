import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { topic } = await req.json();

    if (!topic || typeof topic !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid topic" },
        { status: 400 }
      );
    }

    const prompt = `Write a concise, engaging LinkedIn post about: ${topic}. 
Keep it professional but friendly, suitable for a LinkedIn audience.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a professional LinkedIn post generator." },
        { role: "user", content: prompt },
      ],
      max_tokens: 200,
    });

    const text =
      response.choices[0]?.message?.content?.trim() ??
      "Could not generate post.";

    return NextResponse.json({ text });
  } catch (err) {
    console.error("AI generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate post" },
      { status: 500 }
    );
  }
}
