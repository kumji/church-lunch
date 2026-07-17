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
        requestNote: "",
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

  it("추가 요청 사항을 입력하면 주문에 함께 담겨 저장된다", async () => {
    render(
      <NewOrderView identity={identity} menus={menus} bankInfo={bankInfo} deadline={null} onCreated={vi.fn()} />
    );

    fireEvent.click(screen.getByRole("button", { name: "+" }));
    fireEvent.change(screen.getByLabelText("추가 요청 사항"), {
      target: { value: "김밥에 계란 빼주세요" },
    });
    fireEvent.click(screen.getByRole("button", { name: "주문 완료" }));

    await waitFor(() => {
      expect(createOrder).toHaveBeenCalledWith(
        expect.objectContaining({ requestNote: "김밥에 계란 빼주세요" })
      );
    });
  });

  it("추가 요청 사항 입력칸은 최대 25자까지만 입력할 수 있다", () => {
    render(
      <NewOrderView identity={identity} menus={menus} bankInfo={bankInfo} deadline={null} onCreated={vi.fn()} />
    );

    expect(screen.getByLabelText("추가 요청 사항")).toHaveAttribute("maxLength", "25");
  });

  it("메뉴 목록이 이름 가나다 오름차순으로 정렬되어 보인다", () => {
    const unsortedMenus: Menu[] = [
      { id: "m1", name: "라면", price: 4000, imgUrl: "" },
      { id: "m2", name: "김밥", price: 3000, imgUrl: "" },
      { id: "m3", name: "떡볶이", price: 5000, imgUrl: "" },
    ];
    render(
      <NewOrderView
        identity={identity}
        menus={unsortedMenus}
        bankInfo={bankInfo}
        deadline={null}
        onCreated={vi.fn()}
      />
    );

    const items = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(items[0]).toContain("김밥");
    expect(items[1]).toContain("떡볶이");
    expect(items[2]).toContain("라면");
  });
});
