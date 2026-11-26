// TTFB 실험용 가짜 외부 자원.
// GET /data?delay=500&name=a → 500ms 기다렸다가 { name, delay }를 JSON으로 돌려준다.
// Next.js 서버 밖에서 따로 돌아서, 지연을 만드는 쪽이 측정 대상과 섞이지 않는다.
import { createServer } from "node:http";
import { pathToFileURL } from "node:url";

export function createMockServer() {
  return createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");
    if (url.pathname !== "/data") {
      res.writeHead(404).end();
      return;
    }

    const delay = Number(url.searchParams.get("delay") ?? 0);
    if (!Number.isFinite(delay) || delay < 0) {
      res.writeHead(400, { "content-type": "application/json" });
      res.end(JSON.stringify({ error: "delay는 0 이상의 숫자(ms)여야 합니다" }));
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, delay));
    res.writeHead(200, {
      "content-type": "application/json",
      "cache-control": "no-store", // 매번 새로 받아야 지연이 측정에 반영된다
    });
    res.end(JSON.stringify({ name: url.searchParams.get("name") ?? "data", delay }));
  });
}

// node mock/server.mjs 로 직접 실행했을 때만 포트를 연다 (테스트에서 import할 때는 열지 않음)
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const port = Number(process.env.MOCK_PORT ?? 4000);
  createMockServer().listen(port, () => console.log(`mock 서버: http://localhost:${port}/data?delay=500`));
}
