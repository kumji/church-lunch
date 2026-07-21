import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import MenuOrderStats from "./MenuOrderStats";
import type { Menu, Order } from "@/lib/types";

const menus: Menu[] = [
  { id: "m1", name: "라면", price: 4000, imgUrl: "" },
  { id: "m2", name: "김밥", price: 3000, imgUrl: "" },
];

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "o1",
    name: "홍길동",
    phoneLast4: "1234",
    items: [],
    totalAmount: 0,
    paymentStatus: "none",
    isAdminForced: false,
    ...overrides,
  };
}

describe("MenuOrderStats 메뉴별 주문 수량", () => {
  it("메뉴명 기준 오름차순으로 정렬되어 보인다", () => {
    render(<MenuOrderStats menus={menus} orders={[]} />);

    const items = screen.getAllByRole("listitem").map((li) => li.textContent ?? "");
    expect(items[0]).toContain("김밥");
    expect(items[1]).toContain("라면");
  });

  it("주문 수량을 메뉴별로 합산해서 보여주고, 주문이 없으면 0개로 표시한다", () => {
    const orders: Order[] = [
      makeOrder({ items: [{ menuId: "m1", menuName: "라면", price: 4000, qty: 2 }] }),
      makeOrder({ items: [{ menuId: "m1", menuName: "라면", price: 4000, qty: 1 }] }),
    ];
    render(<MenuOrderStats menus={menus} orders={orders} />);

    expect(screen.getByText("3개")).toBeInTheDocument();
    expect(screen.getByText("0개")).toBeInTheDocument();
  });
});
