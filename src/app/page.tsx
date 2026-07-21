"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CountdownTimer from "@/components/CountdownTimer";
import NewOrderView from "@/components/NewOrderView";
import OrderCheckTab from "@/components/OrderCheckTab";
import { subscribeMenus } from "@/lib/menus";
import { subscribeConfig } from "@/lib/settings";
import { subscribeOrders } from "@/lib/orders";
import type { Config, Menu, Order } from "@/lib/types";

type Tab = "menu" | "check";

export default function HomePage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("menu");
  const [menus, setMenus] = useState<Menu[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [config, setConfig] = useState<Config | null>(null);

  useEffect(() => {
    const unsubMenus = subscribeMenus(setMenus);
    const unsubOrders = subscribeOrders(setOrders);
    const unsubConfig = subscribeConfig(setConfig);
    return () => {
      unsubMenus();
      unsubOrders();
      unsubConfig();
    };
  }, []);

  const bankInfo = config?.bankInfo ?? { bankName: "", accountNumber: "", accountHolder: "" };
  const deadline = config?.deadline || null;

  return (
    <div className="min-h-screen bg-amber-50">
      <CountdownTimer deadline={deadline} />

      <div className="flex justify-end px-4 pt-3">
        <button
          onClick={() => router.push("/admin")}
          className="text-xs text-stone-500 hover:text-stone-700"
        >
          Admin
        </button>
      </div>

      <p className="px-4 text-center text-sm font-medium text-amber-800">광림교회 청장2부</p>
      <h1 className="px-4 pb-3 text-center text-xl font-bold">애찬 주문</h1>

      <div className="mx-auto flex max-w-md gap-2 px-4">
        <button
          onClick={() => setTab("menu")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
            tab === "menu" ? "bg-amber-700 text-white" : "border border-stone-300 bg-white text-stone-900"
          }`}
        >
          메뉴 선택
        </button>
        <button
          onClick={() => setTab("check")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium ${
            tab === "check" ? "bg-amber-700 text-white" : "border border-stone-300 bg-white text-stone-900"
          }`}
        >
          주문 확인
        </button>
      </div>

      {tab === "menu" ? (
        <NewOrderView
          menus={menus}
          orders={orders}
          bankInfo={bankInfo}
          deadline={deadline}
          onCreated={() => setTab("check")}
        />
      ) : (
        <OrderCheckTab menus={menus} orders={orders} bankInfo={bankInfo} deadline={deadline} />
      )}
    </div>
  );
}
