import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import PaymentManager from "./PaymentManager";
import { revertPaymentStatus, setPaymentStatus } from "@/lib/orders";
import type { Order } from "@/lib/types";

vi.mock("@/lib/orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/orders")>();
  return { ...actual, setPaymentStatus: vi.fn(), revertPaymentStatus: vi.fn() };
});

vi.mock("@/lib/csv", () => ({
  downloadCsv: vi.fn(),
  ordersToCsv: vi.fn(() => ""),
}));

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "o1",
    name: "홍길동",
    phoneLast4: "1234",
    items: [{ menuId: "m1", menuName: "김밥", price: 3000, qty: 1 }],
    totalAmount: 3000,
    paymentStatus: "none",
    isAdminForced: false,
    ...overrides,
  };
}

describe("PaymentManager 입금 확인", () => {
  beforeEach(() => {
    vi.mocked(setPaymentStatus).mockClear();
    vi.mocked(revertPaymentStatus).mockClear();
  });

  it("미입금 항목에서 확인 버튼을 누르면 입금 확인 처리를 요청한다", () => {
    const order = makeOrder({ paymentStatus: "none" });
    render(<PaymentManager orders={[order]} />);

    const noneSection = screen.getByText("미입금").closest("div") as HTMLElement;
    fireEvent.click(within(noneSection).getByRole("button", { name: "확인" }));

    expect(setPaymentStatus).toHaveBeenCalledWith(order, "confirmed");
  });

  it("입금완료 항목은 확인 대신 되돌리기 버튼을 눌러 미입금으로 되돌릴 수 있다", () => {
    const order = makeOrder({ paymentStatus: "confirmed", confirmedAmount: 3000 });
    render(<PaymentManager orders={[order]} />);

    const confirmedSection = screen.getByText("입금완료").closest("div") as HTMLElement;
    expect(within(confirmedSection).queryByRole("button", { name: "확인" })).not.toBeInTheDocument();
    fireEvent.click(within(confirmedSection).getByRole("button", { name: "되돌리기" }));

    expect(revertPaymentStatus).toHaveBeenCalledWith(order);
  });

  it("주문 내역은 주문자명 가나다 오름차순으로 정렬되어 보인다", () => {
    const orders = [
      makeOrder({ id: "o1", name: "다현" }),
      makeOrder({ id: "o2", name: "가영" }),
      makeOrder({ id: "o3", name: "나윤" }),
    ];
    render(<PaymentManager orders={orders} />);

    const noneSection = screen.getByText("미입금").closest("div") as HTMLElement;
    const names = within(noneSection)
      .getAllByText(/\(1234\)/)
      .map((el) => el.textContent);

    expect(names[0]).toContain("가영");
    expect(names[1]).toContain("나윤");
    expect(names[2]).toContain("다현");
  });
});
