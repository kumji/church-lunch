import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import HomePage from "./page";

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
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
  return {
    ...actual,
    subscribeOrders: vi.fn((cb: (o: unknown[]) => void) => {
      cb([]);
      return () => {};
    }),
  };
});

describe("HomePage 랜딩 탭", () => {
  beforeEach(() => {
    pushMock.mockClear();
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
});
