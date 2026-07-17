import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ForcedOrderForm from "./ForcedOrderForm";
import { createOrder } from "@/lib/orders";
import type { Menu } from "@/lib/types";

vi.mock("@/lib/orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/orders")>();
  return { ...actual, createOrder: vi.fn() };
});

const menus: Menu[] = [{ id: "m1", name: "김밥", price: 3000, imgUrl: "" }];

describe("ForcedOrderForm 추가 주문 등록", () => {
  it("메뉴 목록이 이름 가나다 오름차순으로 정렬되어 보인다", () => {
    const unsortedMenus: Menu[] = [
      { id: "m1", name: "라면", price: 4000, imgUrl: "" },
      { id: "m2", name: "김밥", price: 3000, imgUrl: "" },
      { id: "m3", name: "떡볶이", price: 5000, imgUrl: "" },
    ];
    render(<ForcedOrderForm menus={unsortedMenus} />);

    const items = screen.getAllByRole("listitem").map((li) => li.textContent);
    expect(items[0]).toContain("김밥");
    expect(items[1]).toContain("떡볶이");
    expect(items[2]).toContain("라면");
  });

  it("입금 상태 선택 없이 등록되며 항상 미입금 상태로 생성된다", () => {
    render(<ForcedOrderForm menus={menus} />);

    expect(screen.queryByText("입금 상태")).not.toBeInTheDocument();
  });

  it("추가 요청 사항을 입력해 주문에 함께 담아 등록할 수 있다", async () => {
    render(<ForcedOrderForm menus={menus} />);

    fireEvent.change(screen.getByPlaceholderText("이름"), { target: { value: "홍길동" } });
    fireEvent.change(screen.getByPlaceholderText("휴대폰 뒷자리 4자리"), { target: { value: "1234" } });
    fireEvent.click(screen.getByRole("button", { name: "+" }));
    fireEvent.change(screen.getByLabelText("추가 요청 사항"), {
      target: { value: "김밥에 계란 빼주세요" },
    });
    fireEvent.click(screen.getByRole("button", { name: "주문 등록" }));

    await waitFor(() => {
      expect(createOrder).toHaveBeenCalledWith(
        expect.objectContaining({
          paymentStatus: "none",
          requestNote: "김밥에 계란 빼주세요",
        })
      );
    });
  });
});
