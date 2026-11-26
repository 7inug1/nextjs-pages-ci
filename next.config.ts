import type { NextConfig } from "next";

// 요청마다 서버가 페이지를 그리는 방식(next start)으로 쓴다.
// TTFB 과제에서 fetch 지연이 요청 시점에 일어나야 하기 때문에 정적 내보내기(output: "export")는 쓰지 않는다.
const nextConfig: NextConfig = {};

export default nextConfig;
