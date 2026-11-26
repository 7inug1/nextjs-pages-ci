import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "nextjs-pages-ci",
  description: "GitHub Actions로 검사하고 AWS EC2에 배포하는 Next.js 서비스",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
