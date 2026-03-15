import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HireIQ - AI-Powered Interview Simulation Platform",
  description: "Intelligent enterprise recruitment platform with AI-driven interviews, smart proctoring, and automated candidate evaluation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
