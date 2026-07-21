"use client";

import { useMemo, useState } from "react";
import MenuQuantitySelector from "./MenuQuantitySelector";
import BankInfoCard from "./BankInfoCard";
import { calcTotal, createOrder, findOrderByIdentity, menuQtyByMenuId } from "@/lib/orders";
import { isPastDeadline } from "@/lib/time";
import { validateEntryForm } from "@/lib/validation";
import { REQUEST_NOTE_MAX_LENGTH } from "@/lib/types";
import type { BankInfo, Identity, Menu, Order, OrderItem } from "@/lib/types";

const MIN_ORDERS_FOR_RANKING = 5;

interface Props {
  menus: Menu[];
  orders: Order[];
  bankInfo: BankInfo;
  deadline: string | null;
  onCreated: (identity: Identity) => void;
}

export default function NewOrderView({ menus, orders, bankInfo, deadline, onCreated }: Props) {
  const [name, setName] = useState("");
  const [phoneLast4, setPhoneLast4] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [requestNote, setRequestNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const sortedMenus = useMemo(
    () => [...menus].sort((a, b) => a.name.localeCompare(b.name, "ko")),
    [menus]
  );

  const rankByMenuId = useMemo(() => {
    if (orders.length < MIN_ORDERS_FOR_RANKING) return undefined;
    const qtyByMenuId = menuQtyByMenuId(orders);
    const ranked = [...qtyByMenuId.entries()]
      .filter(([, qty]) => qty > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2);
    const map = new Map<string, 1 | 2>();
    ranked.forEach(([menuId], i) => map.set(menuId, (i + 1) as 1 | 2));
    return map;
  }, [orders]);

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
    const validationError = validateEntryForm(name, phoneLast4);
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const existing = await findOrderByIdentity(name.trim(), phoneLast4);
      if (existing) {
        setError("이미 등록된 주문이 있습니다. '주문 확인' 탭에서 확인해주세요.");
        setSubmitting(false);
        return;
      }
      await createOrder({
        name: name.trim(),
        phoneLast4,
        items,
        totalAmount: total,
        paymentStatus: "none",
        isAdminForced: false,
        requestNote: requestNote.trim(),
      });
      onCreated({ name: name.trim(), phoneLast4 });
    } catch {
      setError("주문 처리 중 오류가 발생했습니다. 다시 시도해주세요.");
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 p-4">
      <MenuQuantitySelector
        menus={sortedMenus}
        quantities={quantities}
        onChange={(id, qty) => setQuantities((q) => ({ ...q, [id]: qty }))}
        rankByMenuId={rankByMenuId}
      />

      {sortedMenus.length > 0 && (
        <>
          <div className="flex items-center justify-between rounded-lg bg-amber-100 px-4 py-3 font-medium">
            <span>총 주문 금액</span>
            <span>{total.toLocaleString()}원</span>
          </div>

          <div>
            <label htmlFor="request-note" className="mb-1 block text-sm text-stone-900">
              추가 요청 사항
            </label>
            <input
              id="request-note"
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

          <BankInfoCard bankInfo={bankInfo} />

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
