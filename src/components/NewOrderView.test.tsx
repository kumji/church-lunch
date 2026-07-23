import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import NewOrderView from "./NewOrderView";
import { createOrder, findOrderByIdentity } from "@/lib/orders";
import type { Menu, Order } from "@/lib/types";

vi.mock("@/lib/orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/orders")>();
  return { ...actual, createOrder: vi.fn(), findOrderByIdentity: vi.fn() };
});

const menus: Menu[] = [{ id: "m1", name: "김밥", price: 3000, imgUrl: "" }];
const bankInfo = { bankName: "카카오뱅크", accountNumber: "1234567", accountHolder: "전지현" };

function fillIdentity(name: string) {
  fireEvent.change(screen.getByPlaceholderText("이름"), { target: { value: name } });
}

describe("NewOrderView 신규 주문", () => {
  beforeEach(() => {
    vi.mocked(createOrder).mockClear();
    vi.mocked(findOrderByIdentity).mockReset().mockResolvedValue(null);
  });

  it("메뉴와 이름/전화번호를 입력해 정상적으로 주문할 수 있고, 기본 입금 상태는 미입금이다", async () => {
    const onCreated = vi.fn();
    render(
      <NewOrderView menus={menus} orders={[]} bankInfo={bankInfo} deadline={null} onCreated={onCreated} />
    );

    fireEvent.click(screen.getByRole("button", { name: "+" }));
    fillIdentity("홍길동");
    fireEvent.click(screen.getByRole("button", { name: "주문 완료" }));

    await waitFor(() => {
      expect(createOrder).toHaveBeenCalledWith({
        name: "홍길동",
        items: [{ menuId: "m1", menuName: "김밥", price: 3000, qty: 1 }],
        totalAmount: 3000,
        paymentStatus: "none",
        isAdminForced: false,
        requestNote: "",
      });
      expect(onCreated).toHaveBeenCalledWith({ name: "홍길동" });
    });
  });

  it("메뉴를 하나도 선택하지 않으면 주문 완료 버튼이 비활성화된다", () => {
    render(<NewOrderView menus={menus} orders={[]} bankInfo={bankInfo} deadline={null} onCreated={vi.fn()} />);

    expect(screen.getByRole("button", { name: "주문 완료" })).toBeDisabled();
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("이름/전화번호가 유효하지 않으면 에러를 보여주고 주문을 생성하지 않는다", async () => {
    render(<NewOrderView menus={menus} orders={[]} bankInfo={bankInfo} deadline={null} onCreated={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "+" }));
    fillIdentity("홍길동");
    fireEvent.click(screen.getByRole("button", { name: "주문 완료" }));

    await waitFor(() => {
      expect(screen.getByText("뒷자리를 정확하게 입력해주세요.")).toBeInTheDocument();
    });
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("동일한 이름/전화번호로 이미 등록된 주문이 있으면 중복 주문을 막고 안내한다", async () => {
    vi.mocked(findOrderByIdentity).mockResolvedValue({
      id: "existing",
      name: "홍길동",
      items: [],
      totalAmount: 0,
      paymentStatus: "none",
      isAdminForced: false,
    } as Order);

    render(<NewOrderView menus={menus} orders={[]} bankInfo={bankInfo} deadline={null} onCreated={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "+" }));
    fillIdentity("홍길동");
    fireEvent.click(screen.getByRole("button", { name: "주문 완료" }));

    await waitFor(() => {
      expect(screen.getByText("이미 등록된 주문이 있습니다. '주문 확인' 탭에서 확인해주세요.")).toBeInTheDocument();
    });
    expect(createOrder).not.toHaveBeenCalled();
  });

  it("추가 요청 사항을 입력하면 주문에 함께 담겨 저장된다", async () => {
    render(<NewOrderView menus={menus} orders={[]} bankInfo={bankInfo} deadline={null} onCreated={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "+" }));
    fireEvent.change(screen.getByLabelText("추가 요청 사항"), {
      target: { value: "김밥에 계란 빼주세요" },
    });
    fillIdentity("홍길동");
    fireEvent.click(screen.getByRole("button", { name: "주문 완료" }));

    await waitFor(() => {
      expect(createOrder).toHaveBeenCalledWith(
        expect.objectContaining({ requestNote: "김밥에 계란 빼주세요" })
      );
    });
  });

  it("추가 요청 사항 입력칸은 최대 25자까지만 입력할 수 있다", () => {
    render(<NewOrderView menus={menus} orders={[]} bankInfo={bankInfo} deadline={null} onCreated={vi.fn()} />);

    expect(screen.getByLabelText("추가 요청 사항")).toHaveAttribute("maxLength", "25");
  });

  it("메뉴 목록이 이름 가나다 오름차순으로 정렬되어 보인다", () => {
    const unsortedMenus: Menu[] = [
      { id: "m1", name: "라면", price: 4000, imgUrl: "" },
      { id: "m2", name: "김밥", price: 3000, imgUrl: "" },
      { id: "m3", name: "떡볶이", price: 5000, imgUrl: "" },
    ];
    render(
      <NewOrderView menus={unsortedMenus} orders={[]} bankInfo={bankInfo} deadline={null} onCreated={vi.fn()} />
    );

    const items = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(items[0]).toContain("김밥");
    expect(items[1]).toContain("떡볶이");
    expect(items[2]).toContain("라면");
  });

  function makeOrders(count: number, menuId: string, qty: number): Order[] {
    return Array.from({ length: count }, (_, i) => ({
      id: `o${i}`,
      name: `사용자${i}`,
      items: [{ menuId, menuName: "메뉴", price: 1000, qty }],
      totalAmount: 1000 * qty,
      paymentStatus: "none" as const,
      isAdminForced: false,
    }));
  }

  it("총 주문 건수가 5건 미만이면 순위 뱃지를 보여주지 않는다", () => {
    const orders = makeOrders(4, "m1", 3);
    render(<NewOrderView menus={menus} orders={orders} bankInfo={bankInfo} deadline={null} onCreated={vi.fn()} />);

    expect(screen.queryByText("1위")).not.toBeInTheDocument();
  });

  it("총 주문 건수가 5건 이상이면 가장 많이 주문된 메뉴에 1위 뱃지를 보여준다", () => {
    const orders = makeOrders(5, "m1", 3);
    render(<NewOrderView menus={menus} orders={orders} bankInfo={bankInfo} deadline={null} onCreated={vi.fn()} />);

    expect(screen.getByText("1위")).toBeInTheDocument();
  });
});
