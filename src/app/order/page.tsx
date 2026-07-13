"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CountdownTimer from "@/components/CountdownTimer";
import NewOrderView from "@/components/NewOrderView";
import ExistingOrderView from "@/components/ExistingOrderView";
import { subscribeMenus } from "@/lib/menus";
import { subscribeConfig } from "@/lib/settings";
import { findOrderByIdentity } from "@/lib/orders";
import { loadIdentity, clearIdentity } from "@/lib/session";
import type { Config, Identity, Menu, Order } from "@/lib/types";

export default function OrderPage() {
  const router = useRouter();
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [config, setConfig] = useState<Config | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);

  useEffect(() => {
    const id = loadIdentity();
    if (!id) {
      router.replace("/");
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync with sessionStorage (unavailable during SSR)
    setIdentity(id);
  }, [router]);

  useEffect(() => {
    const unsubMenus = subscribeMenus(setMenus);
    const unsubConfig = subscribeConfig(setConfig);
    return () => {
      unsubMenus();
      unsubConfig();
    };
  }, []);

  const refreshOrder = useCallback(async (id: Identity) => {
    setLoadingOrder(true);
    const found = await findOrderByIdentity(id.name, id.phoneLast4);
    setOrder(found);
    setLoadingOrder(false);
  }, []);

  useEffect(() => {
    if (identity) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- fetches order for the identity resolved above
      refreshOrder(identity);
    }
  }, [identity, refreshOrder]);

  function handleExit() {
    clearIdentity();
    router.replace("/");
  }

  if (!identity || loadingOrder) {
    return (
      <div className="flex min-h-screen items-center justify-center text-stone-900">
        불러오는 중...
      </div>
    );
  }

  const bankInfo = config?.bankInfo ?? { bankName: "", accountNumber: "", accountHolder: "" };
  const deadline = config?.deadline || null;

  return (
    <div className="min-h-screen bg-amber-50">
      <CountdownTimer deadline={deadline} />

      <div className="flex justify-end px-4 pt-3">
        <button onClick={handleExit} className="text-sm text-stone-900 hover:text-stone-600">
          다른 사용자로 다시 입력
        </button>
      </div>

      <p className="px-4 pt-1 text-center text-sm font-medium text-amber-800">광림교회 청장2부</p>
      <p className="px-4 pb-2 text-center text-base text-stone-900">
        {identity.name} 님 (010-****-{identity.phoneLast4})
      </p>

      {order ? (
        <ExistingOrderView
          order={order}
          menus={menus}
          bankInfo={bankInfo}
          deadline={deadline}
          onChanged={() => refreshOrder(identity)}
          onDeleted={() => refreshOrder(identity)}
        />
      ) : (
        <NewOrderView
          identity={identity}
          menus={menus}
          bankInfo={bankInfo}
          deadline={deadline}
          onCreated={() => refreshOrder(identity)}
        />
      )}
    </div>
  );
}
