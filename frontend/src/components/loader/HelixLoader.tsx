import { useEffect, useRef } from "react";
import { createLoaderArt } from "./art";

interface Props {
  /** Short status text, announced to screen readers. */
  label?: string;
  /** "page" fills the viewport area; "panel" fits its container; "overlay" floats over a map or list. */
  variant?: "page" | "panel" | "overlay";
}

const sizes = {
  page: "min-h-[70vh] w-full",
  panel: "h-72 w-full",
  overlay: "absolute inset-0 z-20 bg-slate-950/70 backdrop-blur-sm",
};

// DNA helix with floating blood cells and chromosomes. Fades in after a short delay so quick loads never flash it.
export default function HelixLoader({ label = "Loading", variant = "page" }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const art = createLoaderArt(ref.current, { reduced });
    return () => art?.destroy();
  }, []);
  return (
    <div role="status" aria-live="polite" className={`relative flex flex-col items-center justify-center ${sizes[variant]} helix-loader`}>
      <canvas ref={ref} aria-hidden="true" className="absolute inset-0 h-full w-full" />
      <p className="relative mt-auto pb-6 text-xs uppercase tracking-[0.3em] text-slate-300">{label}…</p>
    </div>
  );
}
