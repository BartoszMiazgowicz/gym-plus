import Anthropic from "npm:@anthropic-ai/sdk@0.32.1";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DAILY_LIMIT = 20;

const RESULT_SCHEMA = {
  type: "object",
  properties: {
    food_name: { type: "string", description: "Krótka nazwa potrawy po polsku, np. 'Kurczak z ryżem i brokułami'" },
    amount_g: { type: "number", description: "Szacowana masa całej widocznej porcji w gramach" },
    calories: { type: "number", description: "Szacowane kalorie całej porcji w kcal" },
    protein_g: { type: "number", description: "Szacowane białko całej porcji w gramach" },
    carbs_g: { type: "number", description: "Szacowane węglowodany całej porcji w gramach" },
    fat_g: { type: "number", description: "Szacowany tłuszcz całej porcji w gramach" },
    note: { type: "string", description: "Jedno krótkie zdanie po polsku opisujące co widać na zdjęciu" },
  },
  required: ["food_name", "amount_g", "calories", "protein_g", "carbs_g", "fat_g", "note"],
  additionalProperties: false,
};

const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Require a real logged-in user (not just the public anon key) so this
    // paid endpoint can't be spammed anonymously, and so we can rate-limit per user.
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user }, error: authError } = await callerClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Musisz być zalogowany, aby użyć tej funkcji." }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Per-user daily rate limit, tracked with the service-role client (bypasses RLS).
    const admin = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const today = new Date().toISOString().slice(0, 10);
    const { data: usageRow } = await admin
      .from("meal_photo_usage")
      .select("count")
      .eq("user_id", user.id)
      .eq("day", today)
      .maybeSingle();

    const currentCount = usageRow?.count ?? 0;
    if (currentCount >= DAILY_LIMIT) {
      return new Response(JSON.stringify({ error: `Osiągnięto dzienny limit ${DAILY_LIMIT} analiz zdjęć. Spróbuj ponownie jutro.` }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { image, media_type } = await req.json();
    if (!image || typeof image !== "string") {
      return new Response(JSON.stringify({ error: "Brak zdjęcia" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin
      .from("meal_photo_usage")
      .upsert({ user_id: user.id, day: today, count: currentCount + 1 }, { onConflict: "user_id,day" });

    const response = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 1024,
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: RESULT_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: media_type || "image/jpeg", data: image },
            },
            {
              type: "text",
              text: "Przeanalizuj zdjęcie posiłku. Zidentyfikuj co się na nim znajduje, oszacuj łączną wagę widocznej porcji w gramach oraz kalorie i makroskładniki (białko, węglowodany, tłuszcz) dla CAŁEJ widocznej porcji (nie na 100g). Odpowiedz po polsku.",
            },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return new Response(JSON.stringify({ error: "Model odmówił analizy tego zdjęcia." }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      throw new Error("Brak odpowiedzi tekstowej od modelu");
    }

    const parsed = JSON.parse(textBlock.text);

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("analyze-meal-photo error:", err);
    return new Response(JSON.stringify({ error: "Analiza zdjęcia nie powiodła się" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
