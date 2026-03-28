import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Keeping Inter for fallback if needed, but we'll use Outfit
import "./globals.css";
import '@xyflow/react/dist/style.css';
import { Toaster } from "react-hot-toast";
import { Analytics } from "@vercel/analytics/next";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NoteGraph | AI Second Brain",
  description: "Dump your thoughts. Let AI organize your mind.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="auto" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <div className="app-background"></div>
        <div className="app-grid"></div>
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1A1A24',
              color: '#F0F0FF',
              border: '1px solid #2A2A3A',
              borderRadius: '10px',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#0EA5E9', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#EF4444', secondary: '#fff' },
            },
          }}
        />
        <Analytics />
      </body>
    </html>
  );
}
