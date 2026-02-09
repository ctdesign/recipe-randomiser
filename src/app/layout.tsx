import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Recipe Randomiser",
  description: "Randomly suggests recipes for your weekly meal planning",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50">
        <main className="max-w-lg mx-auto min-h-screen pb-20">
          {children}
        </main>
        <Navigation />
      </body>
    </html>
  );
}
