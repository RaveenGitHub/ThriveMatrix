import type { Metadata } from "next";
import "./globals.css";
import { RavAuthProvider } from "./auth-context";

export const metadata: Metadata = {
  title: "ThriveMatrix",
  description: "Holistic wealth and life progress management",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-IN">
      <body>
        <RavAuthProvider>{children}</RavAuthProvider>
      </body>
    </html>
  );
}
