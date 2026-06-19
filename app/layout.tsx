import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "OSSM — 오픈소스 관리",
  description: "오픈소스 취약점·라이선스·구성 점검",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&family=Roboto+Mono:wght@400;500;700&display=block"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
