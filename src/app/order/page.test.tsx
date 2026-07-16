import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import OrderPage from "./page";
import { findOrderByIdentity } from "@/lib/orders";
import { loadIdentity } from "@/lib/session";
import type { Order } from "@/lib/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/session", () => ({
  loadIdentity: vi.fn(),
  clearIdentity: vi.fn(),
}));

vi.mock("@/lib/menus", () => ({
  subscribeMenus: vi.fn((cb: (m: unknown[]) => void) => {
    cb([]);
    return () => {};
  }),
}));

vi.mock("@/lib/settings", () => ({
  subscribeConfig: vi.fn((cb: (c: null) => void) => {
    cb(null);
    return () => {};
  }),
}));

vi.mock("@/lib/orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/orders")>();
  return { ...actual, findOrderByIdentity: vi.fn() };
});

function makeOrder(): Order {
  return {
    id: "order-1",
    name: "홍길동",
    phoneLast4: "1234",
    items: [{ menuId: "m1", menuName: "김밥", price: 3000, qty: 1 }],
    totalAmount: 3000,
    paymentStatus: "none",
    isAdminForced: false,
  };
}

describe("OrderPage 랜딩 분기", () => {
  beforeEach(() => {
    vi.mocked(loadIdentity).mockReturnValue({ name: "홍길동", phoneLast4: "1234" });
  });

  it("기존 주문 내역이 있으면 주문 내역 확인 화면으로 이동한다", async () => {
    vi.mocked(findOrderByIdentity).mockResolvedValue(makeOrder());
    render(<OrderPage />);

    await waitFor(() => {
      expect(screen.getByText("주문 내역")).toBeInTheDocument();
    });
    expect(screen.queryByText("메뉴 선택")).not.toBeInTheDocument();
  });

  it("기존 주문 내역이 없으면 새 메뉴 신청 화면으로 이동한다", async () => {
    vi.mocked(findOrderByIdentity).mockResolvedValue(null);
    render(<OrderPage />);

    await waitFor(() => {
      expect(screen.getByText("메뉴 선택")).toBeInTheDocument();
    });
    expect(screen.queryByText("주문 내역")).not.toBeInTheDocument();
  });
});
