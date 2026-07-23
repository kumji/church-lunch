import { describe, expect, it, vi, beforeEach } from "vitest";
import { updateDoc } from "firebase/firestore";
import { reconcileOrdersWithMenus } from "./orders";
import type { Menu, Order } from "./types";

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: "o1",
    name: "홍길동",
    items: [{ menuId: "m1", menuName: "김밥", price: 3000, qty: 2 }],
    totalAmount: 6000,
    paymentStatus: "none",
    isAdminForced: false,
    ...overrides,
  };
}

describe("reconcileOrdersWithMenus", () => {
  beforeEach(() => {
    vi.mocked(updateDoc).mockClear();
  });

  it("메뉴 이름/가격이 바뀌면 관련 주문 항목과 총액에도 반영한다", async () => {
    const menus: Menu[] = [{ id: "m1", name: "꼬마김밥", price: 3500, imgUrl: "" }];
    const order = makeOrder();

    await reconcileOrdersWithMenus([order], menus);

    expect(updateDoc).toHaveBeenCalledTimes(1);
    const patch = vi.mocked(updateDoc).mock.calls[0][1] as unknown as Record<string, unknown>;
    expect(patch).toMatchObject({
      items: [{ menuId: "m1", menuName: "꼬마김밥", price: 3500, qty: 2 }],
      totalAmount: 7000,
    });
  });

  it("변경 사항이 없으면 아무 것도 갱신하지 않는다", async () => {
    const menus: Menu[] = [{ id: "m1", name: "김밥", price: 3000, imgUrl: "" }];
    const order = makeOrder();

    await reconcileOrdersWithMenus([order], menus);

    expect(updateDoc).not.toHaveBeenCalled();
  });

  it("이미 입금 확인된 주문의 가격이 바뀌면 차익 계산을 위한 confirmedAmount를 남긴다", async () => {
    const menus: Menu[] = [{ id: "m1", name: "김밥", price: 4000, imgUrl: "" }];
    const order = makeOrder({ paymentStatus: "confirmed" });

    await reconcileOrdersWithMenus([order], menus);

    const patch = vi.mocked(updateDoc).mock.calls[0][1] as unknown as Record<string, unknown>;
    expect(patch.confirmedAmount).toBe(6000);
    expect(patch.totalAmount).toBe(8000);
  });
});
