"use client";

import { useMemo, useState } from "react";
import { amountDiff, deleteAllOrders } from "@/lib/orders";
import { PAYMENT_STATUS_LABEL } from "@/lib/types";
import type { Order } from "@/lib/types";

export default function OrderSummary({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState("");
  const [uncheckedMenus, setUncheckedMenus] = useState<Set<string>>(new Set());
  const [resetting, setResetting] = useState(false);

  const filteredOrders = useMemo(() => {
    const term = search.trim();
    const matched = term ? orders.filter((o) => o.name.includes(term)) : orders;
    return [...matched].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [orders, search]);

  const menuStats = new Map<string, { qty: number; revenue: number }>();
  for (const order of orders) {
    for (const item of order.items) {
      const prev = menuStats.get(item.menuName) ?? { qty: 0, revenue: 0 };
      menuStats.set(item.menuName, {
        qty: prev.qty + item.qty,
        revenue: prev.revenue + item.price * item.qty,
      });
    }
  }
  const sortedMenuStats = [...menuStats.entries()].sort(([a], [b]) => a.localeCompare(b, "ko"));

  function toggleMenu(name: string) {
    setUncheckedMenus((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  const checkedGrandTotal = [...menuStats.entries()]
    .filter(([name]) => !uncheckedMenus.has(name))
    .reduce((sum, [, stat]) => sum + stat.revenue, 0);

  const visibleOrderRows = filteredOrders
    .map((order) => {
      const items = order.items.filter((item) => !uncheckedMenus.has(item.menuName));
      const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
      const isFullOrder = items.length === order.items.length;
      return { order, items, subtotal, isFullOrder };
    })
    .filter(({ items }) => items.length > 0);

  async function handleResetAll() {
    if (!confirm("모든 주문 내역을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) return;
    setResetting(true);
    await deleteAllOrders();
    setResetting(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border border-stone-200 p-4">
        <p className="text-sm text-stone-900">주문 완료 인원수</p>
        <p className="text-2xl font-bold">{orders.length}명</p>
      </div>

      <div className="rounded-lg border border-stone-200 p-4">
        <p className="mb-2 text-sm text-stone-900">메뉴별 주문 완료 수량</p>
        {sortedMenuStats.length === 0 ? (
          <p className="text-sm text-stone-900">주문 내역이 없습니다.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {sortedMenuStats.map(([name, stat]) => (
              <li key={name} className="text-xl font-bold">
                {name}: {stat.qty} 개
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-stone-200 p-4">
        <p className="mb-2 text-sm text-stone-900">메뉴별 주문 수량</p>
        {sortedMenuStats.length === 0 ? (
          <p className="text-sm text-stone-900">주문 내역이 없습니다.</p>
        ) : (
          <>
            <ul className="divide-y divide-stone-100">
              {sortedMenuStats.map(([name, stat]) => (
                <li key={name} className="flex items-center gap-3 py-1.5 text-sm">
                  <input
                    type="checkbox"
                    checked={!uncheckedMenus.has(name)}
                    onChange={() => toggleMenu(name)}
                    className="h-4 w-4 shrink-0"
                  />
                  <span className="flex-1">{name}</span>
                  <span className="text-stone-900">
                    {stat.qty}개 · 단가 {Math.round(stat.revenue / stat.qty).toLocaleString()}원
                  </span>
                  <span className="w-28 text-right font-medium">{stat.revenue.toLocaleString()}원</span>
                </li>
              ))}
            </ul>
            <div className="mt-2 flex justify-between border-t border-stone-200 pt-2 text-sm font-medium">
              <span>총 주문 금액 (체크된 메뉴 기준)</span>
              <span>{checkedGrandTotal.toLocaleString()}원</span>
            </div>
          </>
        )}
      </div>

      <div className="rounded-lg border border-stone-200 p-4">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-sm text-stone-900">주문 내역</p>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="주문자명 검색"
            className="rounded-md border border-stone-300 px-3 py-1.5 text-sm sm:w-56"
          />
        </div>
        {visibleOrderRows.length === 0 ? (
          <p className="text-sm text-stone-900">
            {orders.length === 0 ? "주문 내역이 없습니다." : "표시할 주문이 없습니다."}
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto overflow-x-auto rounded-md border border-stone-100">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="sticky top-0 bg-stone-50 text-stone-900">
                <tr>
                  <th className="px-3 py-2 font-medium">주문자명</th>
                  <th className="px-3 py-2 font-medium">주문한 메뉴</th>
                  <th className="px-3 py-2 font-medium">추가요청사항</th>
                  <th className="px-3 py-2 text-right font-medium">총금액</th>
                  <th className="px-3 py-2 text-center font-medium">입금여부</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {visibleOrderRows.map(({ order, items, subtotal, isFullOrder }) => {
                  const diff = isFullOrder ? amountDiff(order) : null;
                  return (
                    <tr key={order.id}>
                      <td className="px-3 py-2">
                        {order.name} ({order.phoneLast4})
                      </td>
                      <td className="px-3 py-2">
                        {items.map((item) => `${item.menuName} x${item.qty}`).join(", ")}
                      </td>
                      <td className="px-3 py-2 font-medium text-red-600">{order.requestNote}</td>
                      <td className="px-3 py-2 text-right">
                        {subtotal.toLocaleString()}원
                        {diff !== null && (
                          <span className="font-medium text-red-600">
                            {" "}
                            ({diff > 0 ? "+" : ""}
                            {diff.toLocaleString()}원)
                          </span>
                        )}
                      </td>
                      <td
                        className={`px-3 py-2 text-center font-semibold ${
                          order.paymentStatus === "confirmed" ? "text-green-600" : "text-red-600"
                        }`}
                        title={PAYMENT_STATUS_LABEL[order.paymentStatus]}
                      >
                        {order.paymentStatus === "confirmed" ? "O" : "X"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="mb-2 text-sm text-stone-900">
          매주 운영 종료 후 다음 주 주문을 받기 전, 모든 주문 내역을 삭제합니다. 삭제 후에는 복구할 수 없습니다.
        </p>
        <button
          type="button"
          onClick={handleResetAll}
          disabled={resetting || orders.length === 0}
          className="w-full rounded-md bg-red-600 py-3 text-sm font-medium text-white disabled:opacity-50"
        >
          {resetting ? "초기화 중..." : "모든 주문 초기화"}
        </button>
      </div>
    </div>
  );
}
