"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: {
  children: React.ReactNode;
  [prop: string]: unknown;
}) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
} 