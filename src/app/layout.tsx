import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Recipe Randomiser",
  description: "Randomly suggests recipes for your weekly meal planning",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 text-gray-900">
        <main className="max-w-lg mx-auto min-h-screen pb-24 pt-[env(safe-area-inset-top)]">
          {children}
        </main>
        <Navigation />
      </body>
    </html>
  );
}
