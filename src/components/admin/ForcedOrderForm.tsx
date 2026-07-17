"use client";

import { useMemo, useState } from "react";
import MenuQuantitySelector from "@/components/MenuQuantitySelector";
import { calcTotal, createOrder } from "@/lib/orders";
import type { Menu, OrderItem, PaymentStatus } from "@/lib/types";

const STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "none", label: "미입금" },
  { value: "confirmed", label: "입금완료" },
];

export default function ForcedOrderForm({ menus }: { menus: Menu[] }) {
  const [name, setName] = useState("");
  const [phoneLast4, setPhoneLast4] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [status, setStatus] = useState<PaymentStatus>("none");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const sortedMenus = useMemo(
    () => [...menus].sort((a, b) => a.name.localeCompare(b.name, "ko")),
    [menus]
  );

  const items: OrderItem[] = useMemo(
    () =>
      menus
        .filter((m) => (quantities[m.id] ?? 0) > 0)
        .map((m) => ({ menuId: m.id, menuName: m.name, price: m.price, qty: quantities[m.id] })),
    [menus, quantities]
  );
  const total = calcTotal(items);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    if (!name.trim() || !/^\d{4}$/.test(phoneLast4)) {
      setMessage("이름과 휴대폰 뒷자리 4자리를 정확히 입력해주세요.");
      return;
    }
    if (items.length === 0) {
      setMessage("메뉴를 1개 이상 선택해주세요.");
      return;
    }
    setSaving(true);
    await createOrder({
      name: name.trim(),
      phoneLast4,
      items,
      totalAmount: total,
      paymentStatus: status,
      isAdminForced: true,
    });
    setSaving(false);
    setName("");
    setPhoneLast4("");
    setQuantities({});
    setMessage("등록되었습니다. (다른 주문과 동일하게 마감 시간 전까지 수정/삭제 가능합니다)");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-stone-900">
        마감 시간과 무관하게 등록되며, 등록 후에는 다른 주문과 동일하게 마감 시간 전까지 수정/삭제할 수 있습니다.
      </p>

      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm sm:w-40"
        />
        <input
          inputMode="numeric"
          maxLength={4}
          value={phoneLast4}
          onChange={(e) => setPhoneLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="휴대폰 뒷자리 4자리"
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm tracking-widest sm:w-32"
        />
      </div>

      <MenuQuantitySelector menus={sortedMenus} quantities={quantities} onChange={(id, qty) => setQuantities((q) => ({ ...q, [id]: qty }))} />

      <div className="flex items-center justify-between rounded-lg bg-amber-100 px-4 py-3 font-medium">
        <span>총 주문 금액</span>
        <span>{total.toLocaleString()}원</span>
      </div>

      <div>
        <label className="mb-1 block text-sm text-stone-900">입금 상태</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as PaymentStatus)}
          className="rounded-md border border-stone-300 px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {message && <p className="text-sm text-stone-900">{message}</p>}

      <button
        type="submit"
        disabled={saving}
        className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50"
      >
        {saving ? "등록 중..." : "주문 등록"}
      </button>
    </form>
  );
}
