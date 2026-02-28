import React from "react";
import { clsx } from "clsx";

type QuranTextElement = "span" | "p" | "div";

export interface QuranTextProps {
  children: React.ReactNode;
  className?: string;
  as?: QuranTextElement;
}

export default function QuranText({
  children,
  className,
  as: Component = "span",
}: QuranTextProps) {
  return (
    <Component
      className={clsx("quran-text", className)}
      dir="rtl"
      lang="ar"
      style={{ fontFeatureSettings: '"ss01" 1' }}
    >
      {children}
    </Component>
  );
}
