import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import Grainient from "@/components/Grainient";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "Revisio | Next-Gen Learning Companion",
  description: "Upload your PDFs and lecture notes to instantly generate AI study plans, flashcards, quizzes, and mind maps.",
  openGraph: {
    title: "Revisio | Master your exams with AI",
    description: "Transform raw notes into interactive learning experiences.",
    url: "https://studyai.revisly.com", 
    siteName: "Revisio",
    images: [
      {
        url: "https://studyai.revisly.com/og-image.png", 
        width: 1200,
        height: 630,
        alt: "Revisio Platform Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Revisio | Master your exams with AI",
    description: "Transform raw notes into interactive learning experiences.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${outfit.variable} ${playfair.variable} font-sans h-full antialiased`}
      >
        <body className="min-h-full flex flex-col text-[#e8e8f0] relative bg-[#111118]">
          <div className="fixed inset-0 z-0 pointer-events-none opacity-50 mix-blend-screen">
            <Grainient
              color1="#6dfabc"
              color2="#7c6dfa"
              color3="#111118"
              timeSpeed={0.25}
              colorBalance={0}
              warpStrength={1}
              warpFrequency={5}
              warpSpeed={2}
              warpAmplitude={50}
              blendAngle={0}
              blendSoftness={0.05}
              rotationAmount={500}
              noiseScale={2}
              grainAmount={0.1}
              grainScale={2}
              grainAnimated={false}
              contrast={1.5}
              gamma={1}
              saturation={1}
              zoom={0.9}
            />
          </div>
          <div className="relative z-10 flex flex-col flex-1">
            {children}
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
