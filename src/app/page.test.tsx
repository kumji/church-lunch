import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import HomePage from "./page";
import { createOrder, findOrderByIdentity } from "@/lib/orders";
import type { Menu } from "@/lib/types";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
}));

let mockMenus: Menu[] = [];
vi.mock("@/lib/menus", () => ({
  subscribeMenus: vi.fn((cb: (m: Menu[]) => void) => {
    cb(mockMenus);
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
  return {
    ...actual,
    createOrder: vi.fn(),
    findOrderByIdentity: vi.fn(),
    subscribeOrders: vi.fn((cb: (o: unknown[]) => void) => {
      cb([]);
      return () => {};
    }),
  };
});

describe("HomePage 랜딩 탭", () => {
  beforeEach(() => {
    pushMock.mockClear();
    mockMenus = [];
    vi.mocked(createOrder).mockReset();
    vi.mocked(findOrderByIdentity).mockReset();
  });

  it("기본으로 메뉴 선택 탭이 보인다", () => {
    render(<HomePage />);

    expect(screen.getByText("아직 메뉴가 준비되지 않았습니다.")).toBeInTheDocument();
    expect(screen.queryByText("내 주문 확인하기")).not.toBeInTheDocument();
  });

  it("주문 확인 탭을 누르면 주문 확인 화면으로 전환된다", () => {
    render(<HomePage />);

    fireEvent.click(screen.getByRole("button", { name: "주문 확인" }));

    expect(screen.getByText("내 주문 확인하기")).toBeInTheDocument();
  });

  it("Admin 버튼을 누르면 관리자 페이지로 이동한다", () => {
    render(<HomePage />);

    fireEvent.click(screen.getByRole("button", { name: "Admin" }));

    expect(pushMock).toHaveBeenCalledWith("/admin");
  });

  it("주문 완료 후 주문 확인 탭으로 넘어가면서 방금 입력한 이름/번호로 자동 조회된다", async () => {
    mockMenus = [{ id: "m1", name: "김밥", price: 3000, imgUrl: "" }];
    const createdOrder = {
      id: "o1",
      name: "홍길동",
      phoneLast4: "1234",
      items: [{ menuId: "m1", menuName: "김밥", price: 3000, qty: 1 }],
      totalAmount: 3000,
      paymentStatus: "none" as const,
      isAdminForced: false,
    };
    // 1번째 호출: NewOrderView의 중복 주문 확인 (없음). 2번째 호출: 주문 확인 탭의 자동 조회.
    vi.mocked(findOrderByIdentity).mockResolvedValueOnce(null).mockResolvedValueOnce(createdOrder);
    render(<HomePage />);

    fireEvent.click(screen.getByRole("button", { name: "+" }));
    fireEvent.change(screen.getByPlaceholderText("이름"), { target: { value: "홍길동" } });
    fireEvent.change(screen.getByPlaceholderText("0000"), { target: { value: "1234" } });
    fireEvent.click(screen.getByRole("button", { name: "주문 완료" }));

    await waitFor(() => {
      expect(screen.getByText("내 주문 확인하기")).toBeInTheDocument();
      expect(findOrderByIdentity).toHaveBeenLastCalledWith("홍길동", "1234");
      expect(screen.getByText("주문 내역")).toBeInTheDocument();
    });
    expect(createOrder).toHaveBeenCalled();
  });
});
