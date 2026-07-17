import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import BankInfoCard from "./BankInfoCard";

describe("BankInfoCard 계좌 정보 표시", () => {
  it("입력된 계좌 정보가 주문 화면에 정상적으로 보인다", () => {
    render(
      <BankInfoCard bankInfo={{ bankName: "카카오뱅크", accountNumber: "1234567", accountHolder: "전지현" }} />
    );

    expect(screen.getByText("입금 계좌 정보")).toBeInTheDocument();
    expect(screen.getByText("카카오뱅크 1234567 (전지현)")).toBeInTheDocument();
  });

  it("계좌 정보가 비어있으면 아무 것도 보여주지 않는다", () => {
    const { container } = render(
      <BankInfoCard bankInfo={{ bankName: "", accountNumber: "", accountHolder: "" }} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("계좌 복사 버튼을 누르면 계좌번호만 클립보드에 복사한다", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <BankInfoCard bankInfo={{ bankName: "카카오뱅크", accountNumber: "1234567", accountHolder: "전지현" }} />
    );
    fireEvent.click(screen.getByRole("button", { name: "계좌 복사" }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith("1234567");
      expect(screen.getByRole("button", { name: "복사됨" })).toBeInTheDocument();
    });
  });
});
