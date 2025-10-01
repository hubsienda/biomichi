// app/layout.tsx
import "./globals.css";
import { ReactNode } from "react";

export const metadata = {
  title: "Biomichi — Drive Intranet",
  description: "A refined interface on top of Google Drive"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="header">
            <div className="brand">
              <div className="logo" />
              <div>
                <div className="title">Biomichi</div>
                <div className="sub">Elegant workspace for your Google Drive</div>
              </div>
            </div>
          </header>
          {children}
          <footer className="footer">
            Tip: Press <span className="kbd">Enter</span> to search · Sign in with Google required
          </footer>
        </div>
      </body>
    </html>
  );
}
