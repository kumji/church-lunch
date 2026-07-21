"use client";

import { useState } from "react";
import ExistingOrderView from "./ExistingOrderView";
import MenuOrderStats from "./MenuOrderStats";
import { findOrderByIdentity } from "@/lib/orders";
import { validateEntryForm } from "@/lib/validation";
import type { BankInfo, Menu, Order } from "@/lib/types";

interface Props {
  menus: Menu[];
  orders: Order[];
  bankInfo: BankInfo;
  deadline: string | null;
}

export default function OrderCheckTab({ menus, orders, bankInfo, deadline }: Props) {
  const [name, setName] = useState("");
  const [phoneLast4, setPhoneLast4] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  async function handleCheck() {
    const validationError = validateEntryForm(name, phoneLast4);
    if (validationError) {
      setError(validationError);
      return;
    }
    setChecking(true);
    setError("");
    const found = await findOrderByIdentity(name.trim(), phoneLast4);
    setOrder(found);
    setChecking(false);
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 p-4">
      <div className="rounded-lg border border-stone-200 p-4">
        <h2 className="mb-3 text-lg font-semibold">내 주문 확인하기</h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="이름"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-12 flex-1 rounded-lg border-2 border-stone-300 px-3 text-center font-medium outline-none focus:border-stone-500"
          />
          <input
            type="text"
            inputMode="numeric"
            maxLength={4}
            placeholder="0000"
            value={phoneLast4}
            onChange={(e) => setPhoneLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className="h-12 w-28 rounded-lg border-2 border-stone-300 px-3 text-center font-medium tracking-[0.3em] outline-none focus:border-stone-500"
          />
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <button
          type="button"
          disabled={checking}
          onClick={handleCheck}
          className="mt-3 w-full rounded-lg bg-amber-700 py-3 font-medium text-white hover:bg-amber-800 disabled:opacity-50"
        >
          {checking ? "확인 중..." : "확인"}
        </button>
      </div>

      {order === null && (
        <p className="text-center text-sm text-stone-900">해당 이름과 번호로 등록된 주문이 없습니다.</p>
      )}

      {order && (
        <ExistingOrderView
          order={order}
          menus={menus}
          bankInfo={bankInfo}
          deadline={deadline}
          onChanged={handleCheck}
          onDeleted={() => setOrder(null)}
        />
      )}

      <div className="rounded-lg border border-stone-200 p-4">
        <p className="mb-3 text-sm text-stone-900">현재 메뉴별 주문 수량</p>
        <MenuOrderStats menus={menus} orders={orders} />
      </div>
    </div>
  );
}
