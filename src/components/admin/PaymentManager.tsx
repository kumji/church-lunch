"use client";

import { useMemo, useState } from "react";
import { amountDiff, revertPaymentStatus, setPaymentStatus } from "@/lib/orders";
import { downloadCsv, ordersToCsv } from "@/lib/csv";
import type { Order, PaymentStatus } from "@/lib/types";

const GROUPS: { status: PaymentStatus; title: string }[] = [
  { status: "none", title: "미입금" },
  { status: "confirmed", title: "입금완료" },
];

export default function PaymentManager({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim();
    const matched = term ? orders.filter((o) => o.name.includes(term)) : orders;
    return [...matched].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [orders, search]);

  function handleDownload() {
    const csv = ordersToCsv(orders);
    downloadCsv(`애찬주문_${Date.now()}.csv`, csv);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="주문자명 검색"
          className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:w-64"
        />
        <button
          onClick={handleDownload}
          className="rounded-md border border-stone-300 px-4 py-2 text-sm font-medium hover:bg-stone-50"
        >
          엑셀(CSV) 다운로드
        </button>
      </div>

      {GROUPS.map((group) => {
        const list = filtered.filter((o) => o.paymentStatus === group.status);
        return (
          <div key={group.status} className="rounded-lg border border-stone-200 p-4">
            <p className="mb-2 font-medium">
              {group.title} <span className="text-sm text-stone-900">({list.length}명)</span>
            </p>
            {list.length === 0 ? (
              <p className="text-sm text-stone-900">해당 없음</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {list.map((order) => {
                  const diff = amountDiff(order);
                  return (
                    <li key={order.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                      <div>
                        <p>
                          {order.name} ({order.phoneLast4}) · {order.totalAmount.toLocaleString()}원
                          {diff !== null && (
                            <span className="font-medium text-red-600">
                              {" "}
                              ({diff > 0 ? "+" : ""}
                              {diff.toLocaleString()}원)
                            </span>
                          )}
                        </p>
                        <p className="text-stone-900">
                          {order.items.map((item) => `${item.menuName} x${item.qty}`).join(", ")}
                        </p>
                      </div>
                      {group.status === "confirmed" ? (
                        <button
                          onClick={() => revertPaymentStatus(order)}
                          className="shrink-0 rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium hover:bg-stone-50"
                        >
                          되돌리기
                        </button>
                      ) : (
                        <button
                          onClick={() => setPaymentStatus(order, "confirmed")}
                          className="shrink-0 rounded-md bg-amber-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-800"
                        >
                          확인
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
