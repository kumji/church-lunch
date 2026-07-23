import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import RequestNotes from "./RequestNotes";
import type { Order } from "@/lib/types";

function makeOrder(overrides: Partial<Order>): Order {
  return {
    id: overrides.name ?? "o",
    name: "이름없음",
    items: [],
    totalAmount: 0,
    paymentStatus: "none",
    isAdminForced: false,
    ...overrides,
  };
}

describe("RequestNotes 추가요청사항", () => {
  it("요청 사항이 있는 주문만 이름/요청사항으로 보여준다", () => {
    const orders: Order[] = [
      makeOrder({ id: "o1", name: "나윤", requestNote: "라면 맵게" }),
      makeOrder({ id: "o2", name: "가영", requestNote: "김밥에 계란 빼주세요" }),
      makeOrder({ id: "o3", name: "다현", requestNote: "" }),
    ];
    render(<RequestNotes orders={orders} />);

    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);
    expect(screen.getByText("가영")).toBeInTheDocument();
    expect(rows[0]).toHaveTextContent("김밥에 계란 빼주세요");
    expect(screen.getByText("나윤")).toBeInTheDocument();
    expect(screen.queryByText("다현", { exact: false })).not.toBeInTheDocument();
  });

  it("요청 사항이 하나도 없으면 안내 문구를 보여준다", () => {
    render(<RequestNotes orders={[makeOrder({ requestNote: "" })]} />);

    expect(screen.getByText("등록된 요청 사항이 없습니다.")).toBeInTheDocument();
  });
});
