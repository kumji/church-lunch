"use client";

import { useEffect, useState } from "react";
import ExistingOrderView from "./ExistingOrderView";
import MenuOrderStats from "./MenuOrderStats";
import { findOrderByIdentity } from "@/lib/orders";
import { validateEntryForm } from "@/lib/validation";
import type { BankInfo, Identity, Menu, Order } from "@/lib/types";

interface Props {
  menus: Menu[];
  orders: Order[];
  bankInfo: BankInfo;
  deadline: string | null;
  prefill?: Identity | null;
}

export default function OrderCheckTab({ menus, orders, bankInfo, deadline, prefill }: Props) {
  const [name, setName] = useState("");
  const [phoneLast4, setPhoneLast4] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [order, setOrder] = useState<Order | null | undefined>(undefined);

  async function checkIdentity(checkName: string, checkPhoneLast4: string) {
    const validationError = validateEntryForm(checkName, checkPhoneLast4);
    if (validationError) {
      setError(validationError);
      return;
    }
    setChecking(true);
    setError("");
    const found = await findOrderByIdentity(checkName.trim(), checkPhoneLast4);
    setOrder(found);
    setChecking(false);
  }

  function handleCheck() {
    checkIdentity(name, phoneLast4);
  }

  useEffect(() => {
    if (!prefill) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 방금 생성된 주문의 이름/번호를 자동으로 채우고 바로 조회한다
    setName(prefill.name);
    setPhoneLast4(prefill.phoneLast4);
    checkIdentity(prefill.name, prefill.phoneLast4);
  }, [prefill]);

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
        <p className="text-sm text-stone-900">주문 완료 인원수</p>
        <p className="text-2xl font-bold">{orders.length}명</p>
        <p className="mb-3 mt-4 text-sm text-stone-900">메뉴 별 주문 현황</p>
        <MenuOrderStats menus={menus} orders={orders} />
      </div>
    </div>
  );
}
