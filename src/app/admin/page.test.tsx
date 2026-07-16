import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdminLoginPage from "./page";
import { getConfig } from "@/lib/settings";
import { setAdminAuthed } from "@/lib/session";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
}));

vi.mock("@/lib/session", () => ({
  setAdminAuthed: vi.fn(),
}));

vi.mock("@/lib/settings", () => ({
  getConfig: vi.fn(),
  subscribeConfig: vi.fn((cb: (c: null) => void) => {
    cb(null);
    return () => {};
  }),
}));

describe("AdminLoginPage PIN 확인", () => {
  beforeEach(() => {
    pushMock.mockClear();
    vi.mocked(setAdminAuthed).mockClear();
    vi.mocked(getConfig).mockReset();
  });

  it("PIN이 설정과 일치하지 않으면 에러 메시지를 보여주고 로그인을 거부한다", async () => {
    vi.mocked(getConfig).mockResolvedValue({
      deadline: "",
      bankInfo: { bankName: "", accountNumber: "", accountHolder: "" },
      adminPin: "3040",
    });

    render(<AdminLoginPage />);
    fireEvent.change(screen.getByPlaceholderText("••••"), { target: { value: "0000" } });
    fireEvent.click(screen.getByRole("button", { name: "확인" }));

    await waitFor(() => {
      expect(screen.getByText("번호가 맞지 않습니다.")).toBeInTheDocument();
    });
    expect(setAdminAuthed).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("PIN이 일치하면 관리자 대시보드로 이동한다", async () => {
    vi.mocked(getConfig).mockResolvedValue({
      deadline: "",
      bankInfo: { bankName: "", accountNumber: "", accountHolder: "" },
      adminPin: "3040",
    });

    render(<AdminLoginPage />);
    fireEvent.change(screen.getByPlaceholderText("••••"), { target: { value: "3040" } });
    fireEvent.click(screen.getByRole("button", { name: "확인" }));

    await waitFor(() => {
      expect(setAdminAuthed).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith("/admin/dashboard");
    });
  });
});
