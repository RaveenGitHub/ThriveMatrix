import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ThriveMatrix",
  description: "Holistic wealth and life progress management",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}
