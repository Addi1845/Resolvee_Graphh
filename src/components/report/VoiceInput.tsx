import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Mic, Square } from "lucide-react";

import { useI18n } from "@/i18n";
import { transcribeVoiceNote } from "@/lib/voice.functions";

/**
 * Record-and-read-back voice entry for the complaint description.
 *
 * The transcript is placed in the text box so the citizen can correct it
 * before submitting. Nothing is sent on the citizen's behalf unedited, and the
 * recording is not kept after the words have been written out.
 */
export function VoiceInput({ onText }: { onText: (text: string) => void }) {
  const { t, locale } = useI18n();
  const transcribe = useServerFn(transcribeVoiceNote);

  const [recording, setRecording] = useState(false);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);

  async function start() {
    setMessage(null);
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMessage(t("app.voice.unsupported"));
      return;
    }
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setMessage(t("app.voice.denied"));
      return;
    }

    const mime = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/mp4";
    const recorder = new MediaRecorder(stream, { mimeType: mime });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunks.push(event.data);
    };
    recorder.onstop = async () => {
      stream.getTracks().forEach((track) => track.stop());
      setRecording(false);
      setWorking(true);
      try {
        const blob = new Blob(chunks, { type: mime });
        const buffer = new Uint8Array(await blob.arrayBuffer());
        let binary = "";
        for (const byte of buffer) binary += String.fromCharCode(byte);
        const result = await transcribe({
          data: {
            audio: btoa(binary),
            format: mime === "audio/webm" ? "webm" : "m4a",
            language: locale,
          },
        });
        if (result.ok) {
          onText(result.text);
          setMessage(t("app.voice.added"));
        } else {
          setMessage(t(`app.voice.error.${result.reason}`));
        }
      } catch {
        setMessage(t("app.voice.error.failed"));
      } finally {
        setWorking(false);
      }
    };

    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  }

  function stop() {
    recorderRef.current?.stop();
    recorderRef.current = null;
  }

  return (
    <div className="mt-2 rounded-sm border border-border bg-muted/30 p-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={recording ? stop : () => void start()}
          disabled={working}
          className={`inline-flex min-h-11 items-center gap-2 rounded-sm px-4 text-base font-semibold ${
            recording
              ? "bg-destructive text-primary-foreground"
              : "border border-border-strong bg-surface text-foreground"
          } disabled:opacity-60`}
        >
          {working ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : recording ? (
            <Square aria-hidden="true" className="size-4" />
          ) : (
            <Mic aria-hidden="true" className="size-4" />
          )}
          {working
            ? t("app.voice.working")
            : recording
              ? t("app.voice.stop")
              : t("app.voice.start")}
        </button>
        <p className="text-sm text-muted-foreground">{t("app.voice.note")}</p>
      </div>
      {message ? <p className="mt-2 text-sm font-semibold text-foreground">{message}</p> : null}
    </div>
  );
}
