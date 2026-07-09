import { ImageOff } from "lucide-react";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";

interface ImageDisplayProps {
  src: string | null;
  alt: string;
  className?: string;
  fallbackIcon?: LucideIcon;
  size?: "sm" | "md" | "lg";
  rounded?: boolean;
}

const SIZE_MAP: Record<"sm" | "md" | "lg", number> = {
  sm: 40,
  md: 80,
  lg: 160,
};

export function ImageDisplay({
  src,
  alt,
  className = "",
  fallbackIcon: FallbackIcon = ImageOff,
  size = "md",
  rounded = true,
}: ImageDisplayProps) {
  const [hasError, setHasError] = useState(false);
  const dimension = SIZE_MAP[size];

  const imageUrl = src
    ? src.startsWith("http")
      ? src
      : `/uploads/${src}`
    : null;

  const showImage = imageUrl && !hasError;

  return (
    <div
      data-testid="image-display"
      className={`flex items-center justify-center overflow-hidden bg-zinc-100 ${rounded ? "rounded-full" : "rounded-lg"} ${className}`}
      style={{ width: dimension, height: dimension }}
      role="img"
      aria-label={alt}
    >
      {showImage ? (
        <img
          src={imageUrl}
          alt={alt}
          className="h-full w-full object-cover"
          onError={() => setHasError(true)}
        />
      ) : (
        <FallbackIcon
          className="text-zinc-400"
          size={Math.round(dimension * 0.4)}
        />
      )}
    </div>
  );
}
