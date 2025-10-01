import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Biomichi Intranet",
  description: "A clean Drive-powered intranet"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <div className="max-w-6xl mx-auto p-6">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold">Biomichi</h1>
            <p className="text-sm text-gray-600">Drive-powered workspace</p>
          </header>
          {children}
          <footer className="mt-10 text-xs text-gray-500">
            Built with Next.js · Google Sign‑in required
          </footer>
        </div>
      </body>
    </html>
  );
}
