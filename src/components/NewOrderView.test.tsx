import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NewOrderView from "./NewOrderView";
import { createOrder } from "@/lib/orders";
import type { Identity, Menu } from "@/lib/types";

vi.mock("@/lib/orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/orders")>();
  return { ...actual, createOrder: vi.fn() };
});

const identity: Identity = { name: "홍길동", phoneLast4: "1234" };
const menus: Menu[] = [{ id: "m1", name: "김밥", price: 3000, imgUrl: "" }];
const bankInfo = { bankName: "카카오뱅크", accountNumber: "1234567", accountHolder: "전지현" };

describe("NewOrderView 신규 주문", () => {
  beforeEach(() => {
    vi.mocked(createOrder).mockClear();
  });

  it("메뉴를 선택해 정상적으로 주문할 수 있고, 기본 입금 상태는 미입금이다", async () => {
    const onCreated = vi.fn();
    render(
      <NewOrderView identity={identity} menus={menus} bankInfo={bankInfo} deadline={null} onCreated={onCreated} />
    );

    fireEvent.click(screen.getByRole("button", { name: "+" }));
    fireEvent.click(screen.getByRole("button", { name: "주문 완료" }));

    await waitFor(() => {
      expect(createOrder).toHaveBeenCalledWith({
        name: "홍길동",
        phoneLast4: "1234",
        items: [{ menuId: "m1", menuName: "김밥", price: 3000, qty: 1 }],
        totalAmount: 3000,
        paymentStatus: "none",
        isAdminForced: false,
      });
      expect(onCreated).toHaveBeenCalled();
    });
  });

  it("메뉴를 하나도 선택하지 않으면 주문 완료 버튼이 비활성화된다", () => {
    render(
      <NewOrderView identity={identity} menus={menus} bankInfo={bankInfo} deadline={null} onCreated={vi.fn()} />
    );

    expect(screen.getByRole("button", { name: "주문 완료" })).toBeDisabled();
    expect(createOrder).not.toHaveBeenCalled();
  });
});
