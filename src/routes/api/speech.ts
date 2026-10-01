import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import {
  LANGUAGE_LABELS,
  SPEECH_BASE_URL,
  SPEECH_MODEL,
  VOICE_PRESETS,
  EMOTIONS,
  buildInstructions,
  requestSpeech,
} from "@/lib/speech.server";

const schema = z.object({
  text: z.string().min(1).max(4000),
  language: z.enum(Object.keys(LANGUAGE_LABELS) as ["hi", "en", "mr"]),
  gender: z.enum(["male", "female"]),
  preset: z.enum(["classic", "romantic", "action", "storyteller"]),
  emotion: z.enum(["natural", "joyful", "heartfelt", "dramatic", "suspenseful"]),
  speed: z.number().min(0.5).max(2),
});

export const Route = createFileRoute("/api/speech")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const parsed = schema.safeParse(await request.json());
        if (!parsed.success) {
          return Response.json({ error: "Invalid request" }, { status: 400 });
        }
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return Response.json({ error: "Voice service is not configured." }, { status: 401 });
        }
        const { text, language, gender, preset, emotion, speed } = parsed.data;

        const upstream = await requestSpeech(
          { baseURL: SPEECH_BASE_URL, apiKey, model: SPEECH_MODEL, voice: VOICE_PRESETS[gender][preset].voice },
          text,
          buildInstructions(language, gender, preset, emotion),
          speed,
        );

        if (!upstream.ok) {
          const detail = await upstream.text();
          return Response.json(
            { error: detail || "Voice generation failed." },
            { status: upstream.status },
          );
        }

        return new Response(upstream.body, {
          status: 200,
          headers: {
            "Content-Type": upstream.headers.get("content-type") ?? "audio/mpeg",
            "Cache-Control": "no-cache",
          },
        });
      },
    },
  },
});
