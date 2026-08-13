"use client";

import { useMemo, useState } from "react";
import { revertPickupStatus, setPickupStatus } from "@/lib/orders";
import type { Order, PickupStatus } from "@/lib/types";

const GROUPS: { status: PickupStatus; title: string }[] = [
  { status: "none", title: "미픽업" },
  { status: "confirmed", title: "픽업완료" },
];

export default function PickupManager({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim();
    const matched = term ? orders.filter((o) => o.name.includes(term)) : orders;
    return [...matched].sort((a, b) => a.name.localeCompare(b.name, "ko"));
  }, [orders, search]);

  return (
    <div className="flex flex-col gap-5">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="주문자명 검색"
        className="rounded-md border border-stone-300 px-3 py-2 text-sm sm:w-64"
      />

      {GROUPS.map((group) => {
        const list = filtered.filter((o) => (o.pickupStatus ?? "none") === group.status);
        return (
          <div key={group.status} className="rounded-lg border border-stone-200 p-4">
            <p className="mb-2 font-medium">
              {group.title} <span className="text-sm text-stone-900">({list.length}명)</span>
            </p>
            {list.length === 0 ? (
              <p className="text-sm text-stone-900">해당 없음</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {list.map((order) => (
                  <li key={order.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                    <div>
                      <p>{order.name}</p>
                      <p className="text-stone-900">
                        {order.items.map((item) => `${item.menuName} x${item.qty}`).join(", ")}
                      </p>
                    </div>
                    {group.status === "confirmed" ? (
                      <button
                        onClick={() => revertPickupStatus(order)}
                        className="shrink-0 rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium hover:bg-stone-50"
                      >
                        되돌리기
                      </button>
                    ) : (
                      <button
                        onClick={() => setPickupStatus(order, "confirmed")}
                        className="shrink-0 rounded-md bg-amber-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-800"
                      >
                        확인
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
