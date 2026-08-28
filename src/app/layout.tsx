import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agnos Patient Realtime Intake",
  description: "Real-time patient intake assignment demo",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
