import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OrderCheckTab from "./OrderCheckTab";
import { findOrderByIdentity } from "@/lib/orders";
import type { Menu, Order } from "@/lib/types";

vi.mock("@/lib/orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/orders")>();
  return { ...actual, findOrderByIdentity: vi.fn() };
});

const menus: Menu[] = [
  { id: "m1", name: "라면", price: 4000, imgUrl: "" },
  { id: "m2", name: "김밥", price: 3000, imgUrl: "" },
];
const bankInfo = { bankName: "카카오뱅크", accountNumber: "1234567", accountHolder: "전지현" };

function makeOrder(): Order {
  return {
    id: "o1",
    name: "홍길동",
    phoneLast4: "1234",
    items: [{ menuId: "m2", menuName: "김밥", price: 3000, qty: 1 }],
    totalAmount: 3000,
    paymentStatus: "none",
    isAdminForced: false,
  };
}

function checkOrder(name: string, phoneLast4: string) {
  fireEvent.change(screen.getByPlaceholderText("이름"), { target: { value: name } });
  fireEvent.change(screen.getByPlaceholderText("0000"), { target: { value: phoneLast4 } });
  fireEvent.click(screen.getByRole("button", { name: "확인" }));
}

describe("OrderCheckTab 내 주문 확인", () => {
  beforeEach(() => {
    vi.mocked(findOrderByIdentity).mockReset();
  });

  it("등록된 주문이 있으면 주문 내역을 보여준다", async () => {
    vi.mocked(findOrderByIdentity).mockResolvedValue(makeOrder());
    render(<OrderCheckTab menus={menus} orders={[]} bankInfo={bankInfo} deadline={null} />);

    checkOrder("홍길동", "1234");

    await waitFor(() => {
      expect(screen.getByText("주문 내역")).toBeInTheDocument();
    });
  });

  it("등록된 주문이 없으면 안내 문구를 보여준다", async () => {
    vi.mocked(findOrderByIdentity).mockResolvedValue(null);
    render(<OrderCheckTab menus={menus} orders={[]} bankInfo={bankInfo} deadline={null} />);

    checkOrder("홍길동", "9999");

    await waitFor(() => {
      expect(screen.getByText("해당 이름과 번호로 등록된 주문이 없습니다.")).toBeInTheDocument();
    });
  });

  it("이름/전화번호가 유효하지 않으면 에러를 보여주고 조회하지 않는다", () => {
    render(<OrderCheckTab menus={menus} orders={[]} bankInfo={bankInfo} deadline={null} />);

    checkOrder("홍길동", "12");

    expect(screen.getByText("뒷자리를 정확하게 입력해주세요.")).toBeInTheDocument();
    expect(findOrderByIdentity).not.toHaveBeenCalled();
  });

  it("메뉴별 주문 수량을 메뉴명 오름차순으로 보여준다", () => {
    const orders: Order[] = [
      { ...makeOrder(), items: [{ menuId: "m1", menuName: "라면", price: 4000, qty: 2 }] },
    ];
    render(<OrderCheckTab menus={menus} orders={orders} bankInfo={bankInfo} deadline={null} />);

    const items = screen.getAllByRole("listitem").map((li) => li.textContent ?? "");
    const menuStatItems = items.filter((t) => t.includes("김밥") || t.includes("라면"));
    expect(menuStatItems[0]).toContain("김밥");
    expect(menuStatItems[1]).toContain("라면");
    expect(menuStatItems[1]).toContain("2개");
  });
});
