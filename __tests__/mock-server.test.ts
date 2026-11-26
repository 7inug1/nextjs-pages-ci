// @vitest-environment node
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createMockServer } from "../mock/server.mjs";

let base = "";
const server = createMockServer();

beforeAll(async () => {
  await new Promise<void>((resolve) => server.listen(0, resolve)); // 빈 포트를 아무거나 받는다
  base = `http://localhost:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise<void>((resolve) => server.close(() => resolve())));

describe("mock 서버", () => {
  it("delay만큼 기다렸다가 name과 delay를 돌려준다", async () => {
    const start = performance.now();
    const res = await fetch(`${base}/data?delay=200&name=a`);
    const elapsed = performance.now() - start;

    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(await res.json()).toEqual({ name: "a", delay: 200 });
    expect(elapsed).toBeGreaterThanOrEqual(195);
  });

  it("delay가 없으면 기다리지 않는다", async () => {
    const start = performance.now();
    const res = await fetch(`${base}/data`);
    expect(await res.json()).toEqual({ name: "data", delay: 0 });
    expect(performance.now() - start).toBeLessThan(150);
  });

  it("delay가 숫자가 아니거나 음수면 400", async () => {
    expect((await fetch(`${base}/data?delay=abc`)).status).toBe(400);
    expect((await fetch(`${base}/data?delay=-1`)).status).toBe(400);
  });

  it("/data 말고 다른 주소는 404", async () => {
    expect((await fetch(`${base}/nope`)).status).toBe(404);
  });
});
