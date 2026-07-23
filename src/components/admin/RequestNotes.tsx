"use client";

import { useMemo } from "react";
import type { Order } from "@/lib/types";

export default function RequestNotes({ orders }: { orders: Order[] }) {
  const requests = useMemo(
    () =>
      orders
        .filter((o) => o.requestNote && o.requestNote.trim().length > 0)
        .sort((a, b) => a.name.localeCompare(b.name, "ko")),
    [orders]
  );

  return (
    <div className="rounded-lg border border-stone-200 p-4">
      <p className="mb-2 text-sm text-stone-900">추가 요청 사항 ({requests.length}건)</p>
      {requests.length === 0 ? (
        <p className="text-sm text-stone-900">등록된 요청 사항이 없습니다.</p>
      ) : (
        <div className="max-h-96 overflow-y-auto overflow-x-auto rounded-md border border-stone-100">
          <table className="w-full min-w-[420px] text-left text-sm">
            <thead className="sticky top-0 bg-stone-50 text-stone-900">
              <tr>
                <th className="px-3 py-2 font-medium">주문자명</th>
                <th className="px-3 py-2 font-medium">요청사항</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {requests.map((order) => (
                <tr key={order.id}>
                  <td className="px-3 py-2">
                    {order.name}
                  </td>
                  <td className="px-3 py-2">{order.requestNote}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
