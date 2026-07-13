"use client";

import { useMemo, useState } from "react";
import MenuQuantitySelector from "./MenuQuantitySelector";
import BankInfoCard from "./BankInfoCard";
import { calcTotal, deleteOrder, requestPayment, updateOrderItems } from "@/lib/orders";
import { isPastDeadline } from "@/lib/time";
import { PAYMENT_STATUS_LABEL } from "@/lib/types";
import type { BankInfo, Menu, Order, OrderItem } from "@/lib/types";

interface Props {
  order: Order;
  menus: Menu[];
  bankInfo: BankInfo;
  deadline: string | null;
  onChanged: () => void;
  onDeleted: () => void;
}

export default function ExistingOrderView({ order, menus, bankInfo, deadline, onChanged, onDeleted }: Props) {
  const [editing, setEditing] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(order.items.map((i) => [i.menuId, i.qty]))
  );
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const closed = deadline ? isPastDeadline(deadline) : false;
  const lockedByStatus = order.paymentStatus !== "none";
  const canEdit = !closed && !lockedByStatus;

  const editItems: OrderItem[] = useMemo(
    () =>
      menus
        .filter((m) => (quantities[m.id] ?? 0) > 0)
        .map((m) => ({ menuId: m.id, menuName: m.name, price: m.price, qty: quantities[m.id] })),
    [menus, quantities]
  );
  const editTotal = calcTotal(editItems);

  async function handleSave() {
    if (editItems.length === 0) {
      setNotice("메뉴를 1개 이상 선택해주세요.");
      return;
    }
    setBusy(true);
    await updateOrderItems(order.id, editItems);
    setBusy(false);
    setEditing(false);
    onChanged();
  }

  async function handleDelete() {
    if (!confirm("주문을 삭제하시겠습니까?")) return;
    setBusy(true);
    await deleteOrder(order.id);
    setBusy(false);
    onDeleted();
  }

  async function handleRequestPayment() {
    setBusy(true);
    const result = await requestPayment(order);
    setBusy(false);
    if (result === "already-requested") {
      setNotice("이미 요청이 완료되었습니다.");
    } else {
      onChanged();
    }
  }

  const lockMessage = closed
    ? "마감 시간이 지났습니다. 담당자에게 연락주세요."
    : lockedByStatus
    ? "입금 확인 절차가 진행 중이거나 완료되어 수정이 불가합니다. 담당자에게 문의해주세요."
    : "";

  if (editing) {
    return (
      <div className="mx-auto flex max-w-md flex-col gap-5 p-4">
        <h2 className="text-lg font-semibold">주문 수정</h2>
        <MenuQuantitySelector menus={menus} quantities={quantities} onChange={(id, qty) => setQuantities((q) => ({ ...q, [id]: qty }))} />
        <div className="flex items-center justify-between rounded-lg bg-amber-100 px-4 py-3 font-medium">
          <span>총 주문 금액</span>
          <span>{editTotal.toLocaleString()}원</span>
        </div>
        {notice && <p className="text-sm text-red-600">{notice}</p>}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="flex-1 rounded-lg border border-stone-300 py-3 font-medium"
          >
            취소
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleSave}
            className="flex-1 rounded-lg bg-amber-700 py-3 font-medium text-white hover:bg-amber-800 disabled:opacity-50"
          >
            저장
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-5 p-4">
      <h2 className="text-lg font-semibold">주문 내역</h2>

      <div className="rounded-lg border border-stone-200 p-4">
        <ul className="mb-3 divide-y divide-stone-100">
          {order.items.map((item) => (
            <li key={item.menuId} className="flex justify-between py-2 text-sm">
              <span>
                {item.menuName} x {item.qty}
              </span>
              <span>{(item.price * item.qty).toLocaleString()}원</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-stone-200 pt-3 font-medium">
          <span>총 주문 금액</span>
          <span>{order.totalAmount.toLocaleString()}원</span>
        </div>
        <div className="mt-2 text-sm text-stone-900">
          입금 상태: <span className="font-medium text-stone-900">{PAYMENT_STATUS_LABEL[order.paymentStatus]}</span>
        </div>
      </div>

      <BankInfoCard bankInfo={bankInfo} />

      {notice && <p className="text-sm text-red-600">{notice}</p>}

      {order.paymentStatus === "none" && (
        <>
          <p className="text-sm text-stone-900">
            입금 후 확인 요청 버튼을 눌러주세요. 버튼을 누른 뒤에는 주문 수정, 취소가 불가합니다.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={handleRequestPayment}
            className="rounded-lg bg-amber-500 py-3 font-medium text-white disabled:opacity-50"
          >
            입금확인요청
          </button>
        </>
      )}

      {order.paymentStatus === "pending" && (
        <button type="button" disabled className="rounded-lg bg-stone-300 py-3 font-medium text-stone-600">
          요청이 완료되었습니다
        </button>
      )}

      {lockMessage && <p className="text-center text-sm text-stone-900">{lockMessage}</p>}

      {canEdit && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="flex-1 rounded-lg border border-stone-300 py-3 font-medium"
          >
            수정
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={handleDelete}
            className="flex-1 rounded-lg border border-red-300 py-3 font-medium text-red-600"
          >
            삭제
          </button>
        </div>
      )}
    </div>
  );
}
