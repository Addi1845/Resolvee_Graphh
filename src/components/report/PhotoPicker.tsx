import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

import { useI18n } from "@/i18n";
import { MEDIA_POLICY } from "@/lib/policy";

export type DraftPhoto = {
  id: string;
  dataUrl: string;
  name: string;
  source: "gallery_upload" | "in_app_capture";
};

/** Downscale in the browser so uploads stay small on low-bandwidth connections. */
async function downscale(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MEDIA_POLICY.maxEdgePx / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas context");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.82);
}

export function PhotoPicker({
  photos,
  onChange,
}: {
  photos: DraftPhoto[];
  onChange: (next: DraftPhoto[]) => void;
}) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setNotice(null);
    const next = [...photos];
    for (const file of Array.from(files)) {
      if (next.length >= MEDIA_POLICY.maxPhotos) {
        setNotice(t("app.media.tooMany", { n: MEDIA_POLICY.maxPhotos }));
        break;
      }
      if (!file.type.startsWith("image/")) {
        setNotice(t("app.media.wrongType", { name: file.name }));
        continue;
      }
      if (file.size > MEDIA_POLICY.maxPhotoBytes) {
        setNotice(
          t("app.media.tooLarge", {
            name: file.name,
            mb: MEDIA_POLICY.maxPhotoBytes / (1024 * 1024),
          }),
        );
        continue;
      }
      try {
        next.push({
          id: crypto.randomUUID(),
          dataUrl: await downscale(file),
          name: file.name,
          source: "gallery_upload",
        });
      } catch {
        setNotice(t("app.media.wrongType", { name: file.name }));
      }
    }
    onChange(next);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(event) => void handleFiles(event.target.files)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="inline-flex min-h-12 items-center gap-2 rounded-sm border border-border-strong bg-surface px-5 text-base font-semibold text-foreground hover:bg-muted"
      >
        <ImagePlus aria-hidden="true" className="size-4" />
        {t("app.media.add")}
      </button>

      {notice ? (
        <p role="status" className="mt-3 text-sm font-semibold text-warning-foreground">
          {notice}
        </p>
      ) : null}

      {photos.length > 0 ? (
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => (
            <li key={photo.id} className="relative overflow-hidden rounded-sm border border-border">
              <img src={photo.dataUrl} alt={photo.name} className="h-28 w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange(photos.filter((item) => item.id !== photo.id))}
                className="absolute right-1 top-1 inline-flex size-8 items-center justify-center rounded-sm bg-surface/90 text-foreground hover:bg-surface"
                aria-label={`${t("app.media.remove")} ${photo.name}`}
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
