import { useCallback, useEffect, useRef, useState } from "react";
import type { DragEvent, ChangeEvent } from "react";
import { Check, Loader2, Trash2, Upload } from "lucide-react";

interface ImageUploadProps {
  currentImage: string | null;
  onUpload: (file: File) => Promise<unknown>;
  onRemove: () => Promise<unknown>;
  entityLabel: string;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

type UploadState = "idle" | "uploading" | "error" | "success";

export function ImageUpload({
  currentImage,
  onUpload,
  onRemove,
  entityLabel,
}: ImageUploadProps) {
  const [state, setState] = useState<UploadState>("idle");
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const selectedFileRef = useRef<File | null>(null);

  // Clean up ObjectURL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const shownImage =
    previewUrl ?? (currentImage ? `/uploads/${currentImage}` : null);

  const validateAndPreview = useCallback(
    (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Only image files are allowed (JPEG, PNG, WebP, GIF)");
        setState("error");
        return;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      selectedFileRef.current = file;
      setError("");
      setState("idle");
    },
    [previewUrl],
  );

  const handleFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) validateAndPreview(file);
    },
    [validateAndPreview],
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) validateAndPreview(file);
    },
    [validateAndPreview],
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleUpload = async () => {
    const file = selectedFileRef.current;
    if (!file) return;

    setState("uploading");
    setError("");
    try {
      await onUpload(file);
      setState("success");
      setTimeout(() => {
        setState("idle");
        setPreviewUrl(null);
        selectedFileRef.current = null;
      }, 1500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Upload failed",
      );
      setState("error");
    }
  };

  const handleRemove = async () => {
    try {
      setState("uploading");
      await onRemove();
      setState("idle");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Remove failed",
      );
      setState("error");
    }
  };

  const handleRetry = () => {
    setError("");
    setState("idle");
  };



  return (
    <div data-testid="image-upload" className="w-full">
      {/* Current image + remove button (no preview selected) */}
      {currentImage && !previewUrl && state !== "uploading" && (
        <div className="flex flex-col items-center gap-2">
          <div className="relative overflow-hidden rounded-lg">
            <img
              src={`/uploads/${currentImage}`}
              alt={entityLabel}
              className="h-40 w-full rounded-lg object-cover"
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="inline-flex items-center gap-1 rounded bg-red-100 px-3 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-200"
          >
            <Trash2 size={14} />
            Remove image
          </button>
        </div>
      )}

      {/* Success state */}
      {state === "success" && shownImage && (
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={shownImage}
            alt={entityLabel}
            className="h-40 w-full rounded-lg object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Check className="text-white" size={32} />
          </div>
        </div>
      )}

      {/* Uploading state with preview */}
      {state === "uploading" && shownImage && (
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={shownImage}
            alt={entityLabel}
            className="h-40 w-full rounded-lg object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center bg-black/40">
            <Loader2 className="animate-spin text-white" size={32} />
          </div>
        </div>
      )}

      {/* Uploading state without preview */}
      {state === "uploading" && !shownImage && (
        <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-300 p-8">
          <Loader2 className="animate-spin text-zinc-400" size={32} />
        </div>
      )}

      {/* Drop zone (idle, no current image, not uploading, not success) */}
      {!currentImage && state !== "uploading" && state !== "success" && (
        <div
          className={`flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${
            isDragging
              ? "border-green-500 bg-green-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Preview from selected file */}
          {previewUrl ? (
            <div className="mb-3 w-full">
              <img
                src={previewUrl}
                alt="Preview"
                className="mx-auto h-40 rounded-lg object-cover"
              />
            </div>
          ) : (
            <>
              <Upload className="mb-2 text-zinc-400" size={24} />
              <p className="text-sm text-zinc-500">
                Drop an image or click to browse
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                JPEG, PNG, WebP, GIF
              </p>
            </>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Upload button (after file selection) */}
      {selectedFileRef.current && state === "idle" && previewUrl && (
        <button
          type="button"
          onClick={handleUpload}
          className="mt-3 w-full rounded bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800"
        >
          Upload image
        </button>
      )}

      {/* Error state */}
      {state === "error" && (
        <div className="mt-3">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="mt-1 text-sm text-green-700 underline hover:text-green-800"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}
