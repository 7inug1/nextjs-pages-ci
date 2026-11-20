import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // 서버 없이 파일(HTML, CSS, JS)로 내보낸다 (GitHub Pages용)
  images: { unoptimized: true }, // 이미지 최적화는 서버가 필요해서 끈다
};

export default nextConfig;
