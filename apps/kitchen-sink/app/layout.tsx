import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "Agent Ready Kitchen Sink",
  description: "Next.js App Router examples for Agent Ready SDK"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
