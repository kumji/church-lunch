"use client";

import { useMemo, useState } from "react";
import MenuQuantitySelector from "./MenuQuantitySelector";
import BankInfoCard from "./BankInfoCard";
import { calcTotal, createOrder } from "@/lib/orders";
import { isPastDeadline } from "@/lib/time";
import type { BankInfo, Identity, Menu, OrderItem } from "@/lib/types";

interface Props {
  identity: Identity;
  menus: Menu[];
  bankInfo: BankInfo;
  deadline: string | null;
  onCreated: () => void;
}

export default function NewOrderView({ identity, menus, bankInfo, deadline, onCreated }: Props) {
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const sortedMenus = useMemo(
    () => [...menus].sort((a, b) => a.name.localeCompare(b.name, "ko")),
    [menus]
  );

  const items: OrderItem[] = useMemo(
    () =>
      menus
        .filter((m) => (quantities[m.id] ?? 0) > 0)
        .map((m) => ({
          menuId: m.id,
          menuName: m.name,
          price: m.price,
          qty: quantities[m.id],
        })),
    [menus, quantities]
  );

  const total = calcTotal(items);
  const closed = deadline ? isPastDeadline(deadline) : false;

  if (closed) {
    return (
      <div className="mx-auto mt-10 max-w-md rounded-lg border border-red-200 bg-red-50 p-6 text-center text-red-700">
        마감 시간이 지났습니다. 담당자에게 연락주세요.
      </div>
    );
  }

  async function handleSubmit() {
    if (items.length === 0) {
      setError("메뉴를 1개 이상 선택해주세요.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await createOrder({
        name: identity.name,
        phoneLast4: identity.phoneLast4,
        items,
        totalAmount: total,
        paymentStatus: "none",
        isAdminForced: false,
      });
      onCreated();
    } catch {
      setError("주문 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 p-4">
      <h2 className="text-lg font-semibold">메뉴 선택</h2>
      <MenuQuantitySelector menus={sortedMenus} quantities={quantities} onChange={(id, qty) => setQuantities((q) => ({ ...q, [id]: qty }))} />

      {sortedMenus.length > 0 && (
        <>
          <div className="flex items-center justify-between rounded-lg bg-amber-100 px-4 py-3 font-medium">
            <span>총 주문 금액</span>
            <span>{total.toLocaleString()}원</span>
          </div>

          <BankInfoCard bankInfo={bankInfo} />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="button"
            disabled={submitting || total === 0}
            onClick={handleSubmit}
            className="rounded-lg bg-amber-700 py-3 font-medium text-white hover:bg-amber-800 disabled:opacity-50"
          >
            {submitting ? "처리 중..." : "주문 완료"}
          </button>
        </>
      )}
    </div>
  );
}
