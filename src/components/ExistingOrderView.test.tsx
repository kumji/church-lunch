import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ExistingOrderView from "./ExistingOrderView";
import { deleteOrder, updateOrderItems } from "@/lib/orders";
import type { Menu, Order } from "@/lib/types";

vi.mock("@/lib/orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/orders")>();
  return { ...actual, updateOrderItems: vi.fn(), deleteOrder: vi.fn() };
});

const menus: Menu[] = [{ id: "m1", name: "김밥", price: 3000, imgUrl: "" }];
const bankInfo = { bankName: "카카오뱅크", accountNumber: "1234567", accountHolder: "전지현" };

function makeOrder(): Order {
  return {
    id: "o1",
    name: "홍길동",
    items: [{ menuId: "m1", menuName: "김밥", price: 3000, qty: 1 }],
    totalAmount: 3000,
    paymentStatus: "none",
    isAdminForced: false,
  };
}

describe("ExistingOrderView 주문 수정/삭제", () => {
  beforeEach(() => {
    vi.mocked(updateOrderItems).mockClear();
    vi.mocked(deleteOrder).mockClear();
  });

  it("주문을 정상적으로 수정할 수 있다", async () => {
    const onChanged = vi.fn();
    render(
      <ExistingOrderView
        order={makeOrder()}
        menus={menus}
        bankInfo={bankInfo}
        deadline={null}
        onChanged={onChanged}
        onDeleted={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "수정" }));
    fireEvent.click(screen.getByRole("button", { name: "+" }));
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => {
      expect(updateOrderItems).toHaveBeenCalledWith(
        "o1",
        [{ menuId: "m1", menuName: "김밥", price: 3000, qty: 2 }],
        ""
      );
      expect(onChanged).toHaveBeenCalled();
    });
  });

  it("추가 요청 사항이 있으면 주문 내역에 표시된다", () => {
    render(
      <ExistingOrderView
        order={{ ...makeOrder(), requestNote: "주문한 김밥 중 1줄은 계란 빼주세요." }}
        menus={menus}
        bankInfo={bankInfo}
        deadline={null}
        onChanged={vi.fn()}
        onDeleted={vi.fn()}
      />
    );

    expect(screen.getByText("주문한 김밥 중 1줄은 계란 빼주세요.")).toBeInTheDocument();
  });

  it("추가 요청 사항을 수정하거나 지울 수 있다", async () => {
    const onChanged = vi.fn();
    render(
      <ExistingOrderView
        order={{ ...makeOrder(), requestNote: "김밥에 계란 빼주세요" }}
        menus={menus}
        bankInfo={bankInfo}
        deadline={null}
        onChanged={onChanged}
        onDeleted={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "수정" }));
    fireEvent.change(screen.getByLabelText("추가 요청 사항"), { target: { value: "" } });
    fireEvent.click(screen.getByRole("button", { name: "저장" }));

    await waitFor(() => {
      expect(updateOrderItems).toHaveBeenCalledWith(
        "o1",
        [{ menuId: "m1", menuName: "김밥", price: 3000, qty: 1 }],
        ""
      );
    });
  });

  it("주문을 정상적으로 삭제할 수 있다", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    const onDeleted = vi.fn();
    render(
      <ExistingOrderView
        order={makeOrder()}
        menus={menus}
        bankInfo={bankInfo}
        deadline={null}
        onChanged={vi.fn()}
        onDeleted={onDeleted}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "삭제" }));

    await waitFor(() => {
      expect(deleteOrder).toHaveBeenCalledWith("o1");
      expect(onDeleted).toHaveBeenCalled();
    });
  });
});
