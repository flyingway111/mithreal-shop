import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SHOP",
  description: "Vintage & Streetwear",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body style={{ background: '#000', display: 'flex', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ width: '100%', maxWidth: 430, minHeight: '100vh', background: '#060606', position: 'relative', overflow: 'hidden' }}>
          {children}
        </div>
      </body>
    </html>
  );
}
