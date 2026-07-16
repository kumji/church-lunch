import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import EntryPage from "./page";
import { saveIdentity } from "@/lib/session";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
}));

vi.mock("@/lib/session", () => ({
  saveIdentity: vi.fn(),
}));

vi.mock("@/lib/settings", () => ({
  subscribeConfig: vi.fn((cb: (c: null) => void) => {
    cb(null);
    return () => {};
  }),
}));

describe("EntryPage 로그인", () => {
  beforeEach(() => {
    pushMock.mockClear();
    vi.mocked(saveIdentity).mockClear();
  });

  it("전화번호 뒷자리가 4자리가 아니면 에러 메시지를 보여주고 로그인을 거부한다", () => {
    render(<EntryPage />);
    fireEvent.change(screen.getByPlaceholderText("이름"), { target: { value: "홍길동" } });
    fireEvent.change(screen.getByPlaceholderText("0000"), { target: { value: "12" } });
    fireEvent.click(screen.getByRole("button", { name: "확인" }));

    expect(screen.getByText("뒷자리를 정확하게 입력해주세요.")).toBeInTheDocument();
    expect(saveIdentity).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("이름이 5글자 이상이면 에러 메시지를 보여주고 로그인을 거부한다", () => {
    render(<EntryPage />);
    fireEvent.change(screen.getByPlaceholderText("이름"), { target: { value: "홍길동전우치" } });
    fireEvent.change(screen.getByPlaceholderText("0000"), { target: { value: "1234" } });
    fireEvent.click(screen.getByRole("button", { name: "확인" }));

    expect(screen.getByText("이름을 5글자 미만으로 작성해주세요.")).toBeInTheDocument();
    expect(saveIdentity).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("이름과 전화번호가 유효하면 로그인에 성공하고 주문 페이지로 이동한다", () => {
    render(<EntryPage />);
    fireEvent.change(screen.getByPlaceholderText("이름"), { target: { value: "홍길동" } });
    fireEvent.change(screen.getByPlaceholderText("0000"), { target: { value: "1234" } });
    fireEvent.click(screen.getByRole("button", { name: "확인" }));

    expect(saveIdentity).toHaveBeenCalledWith({ name: "홍길동", phoneLast4: "1234" });
    expect(pushMock).toHaveBeenCalledWith("/order");
  });
});
