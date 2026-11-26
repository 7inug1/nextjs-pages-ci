import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("첫 화면", () => {
  it("제목과 설명을 보여 준다", () => {
    render(<Home />);
    expect(
      screen.getByRole("heading", { level: 1, name: "nextjs-pages-ci" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("GitHub Actions로 검사하고 AWS EC2에 배포하는 Next.js 서비스"),
    ).toBeInTheDocument();
  });
});
