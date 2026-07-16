import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import CountdownTimer from "./CountdownTimer";

describe("CountdownTimer 마감시간 카운트다운", () => {
  it("마감 시간이 미래이면 남은 시간을 카운트다운으로 보여준다", () => {
    const deadline = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1시간 뒤
    render(<CountdownTimer deadline={deadline} />);

    expect(screen.getByText(/마감까지 남은 시간/)).toBeInTheDocument();
    expect(screen.getByText(/01:00:0\d|00:59:5\d/)).toBeInTheDocument();
  });

  it("마감 시간이 지났으면 마감되었다고 보여준다", () => {
    const deadline = new Date(Date.now() - 60 * 1000).toISOString(); // 1분 전
    render(<CountdownTimer deadline={deadline} />);

    expect(screen.getByText("마감되었습니다")).toBeInTheDocument();
  });

  it("마감 시간이 설정되지 않았으면 안내 문구를 보여준다", () => {
    render(<CountdownTimer deadline={null} />);

    expect(screen.getByText("마감 시간이 아직 설정되지 않았습니다.")).toBeInTheDocument();
  });
});
