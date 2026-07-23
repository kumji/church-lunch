import { describe, expect, it } from "vitest";
import { amountDiff, calcTotal, menuQtyByMenuId } from "./orders";
import type { Order, OrderItem } from "./types";

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "order-1",
    name: "홍길동",
    items: [],
    totalAmount: 0,
    paymentStatus: "none",
    isAdminForced: false,
    ...overrides,
  };
}

describe("calcTotal", () => {
  it("항목별 가격*수량의 합을 반환한다", () => {
    const items: OrderItem[] = [
      { menuId: "m1", menuName: "김밥", price: 3000, qty: 2 },
      { menuId: "m2", menuName: "라면", price: 4000, qty: 1 },
    ];
    expect(calcTotal(items)).toBe(10000);
  });

  it("항목이 없으면 0을 반환한다", () => {
    expect(calcTotal([])).toBe(0);
  });
});

describe("amountDiff", () => {
  it("confirmedAmount가 없으면 null을 반환한다 (미입금)", () => {
    const order = makeOrder({ totalAmount: 10000 });
    expect(amountDiff(order)).toBeNull();
  });

  it("confirmedAmount와 totalAmount가 같으면 null을 반환한다", () => {
    const order = makeOrder({ totalAmount: 10000, confirmedAmount: 10000 });
    expect(amountDiff(order)).toBeNull();
  });

  it("가격 인상으로 totalAmount가 늘어나면 양수 차익을 반환한다", () => {
    const order = makeOrder({ totalAmount: 11000, confirmedAmount: 10000 });
    expect(amountDiff(order)).toBe(1000);
  });

  it("가격 인하로 totalAmount가 줄어들면 음수 차익을 반환한다", () => {
    const order = makeOrder({ totalAmount: 9000, confirmedAmount: 10000 });
    expect(amountDiff(order)).toBe(-1000);
  });
});

describe("menuQtyByMenuId", () => {
  it("여러 주문에 걸친 메뉴별 수량을 menuId 기준으로 합산한다", () => {
    const orders: Order[] = [
      makeOrder({
        items: [
          { menuId: "m1", menuName: "김밥", price: 3000, qty: 2 },
          { menuId: "m2", menuName: "라면", price: 4000, qty: 1 },
        ],
      }),
      makeOrder({ items: [{ menuId: "m1", menuName: "김밥", price: 3000, qty: 1 }] }),
    ];

    const result = menuQtyByMenuId(orders);
    expect(result.get("m1")).toBe(3);
    expect(result.get("m2")).toBe(1);
  });

  it("주문이 없으면 빈 Map을 반환한다", () => {
    expect(menuQtyByMenuId([]).size).toBe(0);
  });
});
