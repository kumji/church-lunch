"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CountdownTimer from "@/components/CountdownTimer";
import MenuManager from "@/components/admin/MenuManager";
import SettingsManager from "@/components/admin/SettingsManager";
import OrderSummary from "@/components/admin/OrderSummary";
import PaymentManager from "@/components/admin/PaymentManager";
import ForcedOrderForm from "@/components/admin/ForcedOrderForm";
import { subscribeMenus } from "@/lib/menus";
import { subscribeConfig } from "@/lib/settings";
import { reconcileOrdersWithMenus, subscribeOrders } from "@/lib/orders";
import { clearAdminAuthed, isAdminAuthed } from "@/lib/session";
import type { Config, Menu, Order } from "@/lib/types";

type Tab = "menu" | "settings" | "summary" | "payment" | "forced";

const TABS: { key: Tab; label: string }[] = [
  { key: "menu", label: "메뉴 관리" },
  { key: "settings", label: "마감/계좌 설정" },
  { key: "summary", label: "주문 현황" },
  { key: "payment", label: "입금 확인" },
  { key: "forced", label: "추가 주문 등록" },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("menu");
  const [menus, setMenus] = useState<Menu[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    if (!isAdminAuthed()) {
      router.replace("/admin");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync with sessionStorage (unavailable during SSR)
    setAuthed(true);
  }, [router]);

  useEffect(() => {
    if (!authed) return;
    const unsubMenus = subscribeMenus(setMenus);
    const unsubOrders = subscribeOrders(setOrders);
    const unsubConfig = subscribeConfig(setConfig);
    return () => {
      unsubMenus();
      unsubOrders();
      unsubConfig();
    };
  }, [authed]);

  useEffect(() => {
    // 메뉴 이름/가격이 바뀐 뒤 아직 반영되지 않은 주문 항목이 있으면 자동으로 맞춰준다.
    if (menus.length > 0 && orders.length > 0) {
      reconcileOrdersWithMenus(orders, menus);
    }
  }, [menus, orders]);

  function handleLogout() {
    clearAdminAuthed();
    router.replace("/admin");
  }

  if (!authed) {
    return <div className="flex min-h-screen items-center justify-center text-stone-900">확인 중...</div>;
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <CountdownTimer deadline={config?.deadline || null} />

      <div className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-amber-800">광림교회 청장2부</p>
            <h1 className="text-xl font-bold">관리자 대시보드</h1>
          </div>
          <button onClick={handleLogout} className="text-sm text-stone-900 hover:text-stone-600">
            로그아웃
          </button>
        </div>

        <div className="mb-6 flex flex-wrap gap-2 border-b border-stone-200">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-3 py-2 text-sm font-medium text-stone-900 ${
                tab === t.key ? "border-b-2 border-amber-700" : ""
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "menu" && <MenuManager menus={menus} />}
        {tab === "settings" && <SettingsManager config={config} />}
        {tab === "summary" && <OrderSummary orders={orders} />}
        {tab === "payment" && <PaymentManager orders={orders} />}
        {tab === "forced" && <ForcedOrderForm menus={menus} />}
      </div>
    </div>
  );
}
