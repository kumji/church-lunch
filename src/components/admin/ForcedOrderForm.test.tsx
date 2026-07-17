import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ForcedOrderForm from "./ForcedOrderForm";
import type { Menu } from "@/lib/types";

vi.mock("@/lib/orders", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/orders")>();
  return { ...actual, createOrder: vi.fn() };
});

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
});
