import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import OrderSummary from "./OrderSummary";
import type { Order } from "@/lib/types";

vi.mock("@/lib/orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/orders")>();
  return { ...actual, deleteAllOrders: vi.fn() };
});

function makeOrder(overrides: Partial<Order>): Order {
  return {
    id: overrides.name ?? "o",
    name: "이름없음",
    items: [],
    totalAmount: 0,
    paymentStatus: "none",
    isAdminForced: false,
    ...overrides,
  };
}

const orders: Order[] = [
  makeOrder({ id: "o1", name: "가영", items: [{ menuId: "m1", menuName: "김밥", price: 3000, qty: 1 }], totalAmount: 3000 }),
  makeOrder({ id: "o2", name: "나윤", items: [{ menuId: "m2", menuName: "라면", price: 4000, qty: 1 }], totalAmount: 4000 }),
  makeOrder({
    id: "o3",
    name: "다현",
    items: [
      { menuId: "m1", menuName: "김밥", price: 3000, qty: 1 },
      { menuId: "m2", menuName: "라면", price: 4000, qty: 1 },
    ],
    totalAmount: 7000,
  }),
];

describe("OrderSummary 주문 현황", () => {
  it("주문 내역은 주문자명 가나다 오름차순으로 정렬되어 보인다", () => {
    render(<OrderSummary orders={orders} />);

    const rows = screen.getAllByRole("row").slice(1); // 첫 행은 헤더
    const names = rows.map((row) => row.textContent);

    expect(names[0]).toContain("가영");
    expect(names[1]).toContain("나윤");
    expect(names[2]).toContain("다현");
  });

  it("메뉴 체크박스를 해제하면 총 주문 금액과 주문 내역이 그에 맞게 필터링된다", () => {
    render(<OrderSummary orders={orders} />);

    const grandTotalRow = screen.getByText("총 주문 금액 (체크된 메뉴 기준)").closest("div") as HTMLElement;
    expect(within(grandTotalRow).getByText("14,000원")).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(4); // 헤더 + 3건

    const ramenRow = screen.getByText("라면").closest("li") as HTMLElement;
    fireEvent.click(within(ramenRow).getByRole("checkbox"));

    expect(within(grandTotalRow).getByText("6,000원")).toBeInTheDocument();
    const rowsAfter = screen.getAllByRole("row");
    expect(rowsAfter).toHaveLength(3); // 헤더 + 라면을 포함하지 않는 2건
    expect(screen.queryByText("나윤")).not.toBeInTheDocument();
    expect(screen.getByText(/다현/)).toBeInTheDocument();
    // 가영(원래 김밥만 주문)과, 라면이 필터링되어 김밥만 남은 다현 두 행 모두 "김밥 x1"만 보여야 한다.
    expect(screen.getAllByText("김밥 x1")).toHaveLength(2);
  });

  it("입금여부는 미입금이면 X, 입금완료면 O로 표시된다", () => {
    const item = { menuId: "m1", menuName: "김밥", price: 3000, qty: 1 };
    const mixedOrders: Order[] = [
      makeOrder({ id: "o1", name: "가영", items: [item], totalAmount: 3000, paymentStatus: "none" }),
      makeOrder({ id: "o2", name: "나윤", items: [item], totalAmount: 3000, paymentStatus: "confirmed" }),
    ];
    render(<OrderSummary orders={mixedOrders} />);

    const rows = screen.getAllByRole("row").slice(1);
    expect(rows[0]).toHaveTextContent("X");
    expect(rows[1]).toHaveTextContent("O");
  });

  it("추가요청사항이 있으면 주문 내역에 빨간 글씨로 표시된다", () => {
    const item = { menuId: "m1", menuName: "김밥", price: 3000, qty: 1 };
    const withNote: Order[] = [
      makeOrder({ id: "o1", name: "가영", items: [item], totalAmount: 3000, requestNote: "계란 빼주세요" }),
    ];
    render(<OrderSummary orders={withNote} />);

    const note = screen.getByText("계란 빼주세요");
    expect(note).toBeInTheDocument();
    expect(note).toHaveClass("text-red-600");
  });
});
