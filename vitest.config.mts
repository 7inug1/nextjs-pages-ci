import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./", import.meta.url)) } },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    // 실패 분석 워크플로가 읽는 결과 파일(report.xml)을 만든다
    reporters: ["default", "junit"],
    outputFile: { junit: "report.xml" },
  },
});
