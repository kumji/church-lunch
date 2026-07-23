"use client";

import { useMemo, useState } from "react";
import MenuQuantitySelector from "@/components/MenuQuantitySelector";
import { calcTotal, createOrder } from "@/lib/orders";
import { REQUEST_NOTE_MAX_LENGTH } from "@/lib/types";
import type { Menu, OrderItem } from "@/lib/types";

export default function ForcedOrderForm({ menus }: { menus: Menu[] }) {
  const [name, setName] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [requestNote, setRequestNote] = useState("");
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
    if (!name.trim()) {
      setMessage("이름을 정확히 입력해주세요.");
      return;
    }
    if (items.length === 0) {
      setMessage("메뉴를 1개 이상 선택해주세요.");
      return;
    }
    setSaving(true);
    await createOrder({
      name: name.trim(),
      items,
      totalAmount: total,
      paymentStatus: "none",
      isAdminForced: true,
      requestNote: requestNote.trim(),
    });
    setSaving(false);
    setName("");
    setQuantities({});
    setRequestNote("");
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
      </div>

      <MenuQuantitySelector menus={sortedMenus} quantities={quantities} onChange={(id, qty) => setQuantities((q) => ({ ...q, [id]: qty }))} />

      <div className="flex items-center justify-between rounded-lg bg-amber-100 px-4 py-3 font-medium">
        <span>총 주문 금액</span>
        <span>{total.toLocaleString()}원</span>
      </div>

      <div>
        <label htmlFor="forced-request-note" className="mb-1 block text-sm text-stone-900">
          추가 요청 사항
        </label>
        <input
          id="forced-request-note"
          type="text"
          maxLength={REQUEST_NOTE_MAX_LENGTH}
          placeholder="ex: 김밥에 계란 빼주세요."
          value={requestNote}
          onChange={(e) => setRequestNote(e.target.value)}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
        <p className="mt-1 text-right text-xs text-stone-500">
          {requestNote.length}/{REQUEST_NOTE_MAX_LENGTH}
        </p>
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
