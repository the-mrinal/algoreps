import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data } = await supabase
    .from("profiles")
    .select("theme_preference")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    theme_preference: data?.theme_preference ?? "system",
  });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const theme = body.theme;

  if (!["light", "dark", "system"].includes(theme)) {
    return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ theme_preference: theme })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ theme_preference: theme });
}
