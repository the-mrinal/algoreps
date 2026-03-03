import { NextResponse } from "next/server";
import { buildReviewPrompt } from "@/lib/ai-review";
import { createClient } from "@/lib/supabase/server";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export async function POST(req: Request) {
  try {
    // Auth + premium guard
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("is_premium")
      .eq("id", user.id)
      .single();

    if (!profile?.is_premium) {
      return NextResponse.json(
        { error: "Premium feature — upgrade to use AI analysis" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { code, language, problemTitle, problemDescription } = body;

    if (!code || !problemTitle || !problemDescription) {
      return NextResponse.json(
        { error: "Missing required fields: code, problemTitle, problemDescription" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY not configured" },
        { status: 500 }
      );
    }

    const prompt = buildReviewPrompt(code, problemTitle, problemDescription, language || "python3");

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });

    if (response.status === 429) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        { status: 429 }
      );
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("Gemini API error:", response.status, errorData);
      return NextResponse.json(
        { error: "AI review service unavailable" },
        { status: 502 }
      );
    }

    const data = await response.json();

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      console.error("Unexpected Gemini response structure:", JSON.stringify(data));
      return NextResponse.json(
        { error: "AI review returned an unexpected response" },
        { status: 502 }
      );
    }

    const review = JSON.parse(text);

    return NextResponse.json(review);
  } catch (error) {
    console.error("Analyze API error:", error);
    return NextResponse.json(
      { error: "Failed to process AI review" },
      { status: 500 }
    );
  }
}
