import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // 서버 없이 파일(HTML, CSS, JS)로 내보낸다 (GitHub Pages용)
  images: { unoptimized: true }, // 이미지 최적화는 서버가 필요해서 끈다
  // 프로젝트 사이트 주소는 /저장소이름/ 아래라서 경로 접두사가 필요하다 (로컬 빌드는 빈 값)
  basePath: process.env.NEXT_PUBLIC_BASE_PATH ?? "",
};

export default nextConfig;
