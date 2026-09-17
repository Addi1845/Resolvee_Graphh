import { createServerFn } from "@tanstack/react-start";

/**
 * Spoken complaint input.
 *
 * A citizen who cannot type can speak the problem instead. The recording is
 * transcribed into plain text that the citizen can read and correct before
 * submitting: the transcript is a draft aid, never an unreviewed statement.
 * The audio itself is not stored here.
 */

const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
const ALLOWED_FORMATS = ["webm", "m4a", "mp3", "wav", "ogg"] as const;

type VoiceInput = { audio: string; format: string; language: string };

export const transcribeVoiceNote = createServerFn({ method: "POST" })
  .inputValidator((input: VoiceInput) => {
    const audio = typeof input?.audio === "string" ? input.audio : "";
    if (!audio) throw new Error("empty_recording");
    if (audio.length * 0.75 > MAX_AUDIO_BYTES) throw new Error("recording_too_long");
    const format = (ALLOWED_FORMATS as readonly string[]).includes(input?.format)
      ? input.format
      : "webm";
    const language = ["en", "hi", "mr"].includes(input?.language) ? input.language : "en";
    return { audio, format, language };
  })
  .handler(async ({ data }) => {
    const apiKey = process.env['LOVABLE_API_KEY'];
    if (!apiKey) return { ok: false as const, reason: "unavailable" };

    const languageName = data.language === "hi" ? "Hindi" : data.language === "mr" ? "Marathi" : "English";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.5-transcribe",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Transcribe this civic complaint recording word for word in ${languageName}. Return only the transcript text, with no commentary, no translation and no summary. If nothing intelligible was said, return an empty response.`,
              },
              { type: "input_audio", input_audio: { data: data.audio, format: data.format } },
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      console.error(`Voice transcription failed [${response.status}]: ${body}`);
      if (response.status === 429) return { ok: false as const, reason: "busy" };
      if (response.status === 402 || response.status === 403)
        return { ok: false as const, reason: "unavailable" };
      return { ok: false as const, reason: "failed" };
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: unknown } }>;
    };
    const raw = payload.choices?.[0]?.message?.content;
    const text = typeof raw === "string" ? raw.trim() : "";
    if (!text) return { ok: false as const, reason: "empty" };
    return { ok: true as const, text };
  });
