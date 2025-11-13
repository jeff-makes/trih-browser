import type { Metadata } from "next";

import { Footer } from "@/components/layout/Footer";

import "./globals.css";

export const metadata: Metadata = {
  title: "The Rest Is History Explorer",
  description: "Browse The Rest Is History episodes, series, people, places, and topics in one place."
};

export default function RootLayout(props: Readonly<{ children: React.ReactNode }>) {
  const { children } = props;

  return (
    <html lang="en">
      <body>
        <div className="site-shell">
          <div className="site-content">{children}</div>
          <Footer />
        </div>
      </body>
    </html>
  );
}
