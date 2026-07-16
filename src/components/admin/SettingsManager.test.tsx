import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SettingsManager from "./SettingsManager";
import { setConfig } from "@/lib/settings";

vi.mock("@/lib/settings", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/settings")>();
  return { ...actual, setConfig: vi.fn() };
});

describe("SettingsManager 마감시간/계좌 설정", () => {
  beforeEach(() => {
    vi.mocked(setConfig).mockClear();
  });

  it("마감 시간과 계좌 정보를 입력해 저장할 수 있다", async () => {
    render(<SettingsManager config={null} />);

    fireEvent.change(screen.getByLabelText("마감 시간 (한국 표준시 기준)"), {
      target: { value: "2026-07-20T13:00" },
    });
    fireEvent.change(screen.getByLabelText("은행명"), { target: { value: "카카오뱅크" } });
    fireEvent.change(screen.getByLabelText("계좌번호"), { target: { value: "1234567" } });
    fireEvent.change(screen.getByLabelText("예금주"), { target: { value: "전지현" } });
    fireEvent.change(screen.getByLabelText("관리자 PIN (4자리 숫자)"), { target: { value: "1234" } });
    fireEvent.click(screen.getByRole("button", { name: "설정 저장" }));

    await waitFor(() => {
      expect(setConfig).toHaveBeenCalledWith({
        deadline: "2026-07-20T13:00:00+09:00",
        bankInfo: { bankName: "카카오뱅크", accountNumber: "1234567", accountHolder: "전지현" },
        adminPin: "1234",
      });
    });
  });

  it("관리자 PIN이 4자리 숫자가 아니면 저장하지 않는다", () => {
    vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<SettingsManager config={null} />);

    fireEvent.change(screen.getByLabelText("관리자 PIN (4자리 숫자)"), { target: { value: "12" } });
    fireEvent.click(screen.getByRole("button", { name: "설정 저장" }));

    expect(setConfig).not.toHaveBeenCalled();
    expect(window.alert).toHaveBeenCalledWith("관리자 PIN은 4자리 숫자여야 합니다.");
  });
});
