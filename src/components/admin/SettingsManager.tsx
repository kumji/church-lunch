"use client";

import { useEffect, useState } from "react";
import { setConfig } from "@/lib/settings";
import { kstISOToLocalInput, localInputToKSTISOString } from "@/lib/time";
import type { Config } from "@/lib/types";

export default function SettingsManager({ config }: { config: Config | null }) {
  const [deadlineLocal, setDeadlineLocal] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [adminPin, setAdminPin] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!config) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncs local form fields when config loads/changes from Firestore
    setDeadlineLocal(config.deadline ? kstISOToLocalInput(config.deadline) : "");
    setBankName(config.bankInfo.bankName);
    setAccountNumber(config.bankInfo.accountNumber);
    setAccountHolder(config.bankInfo.accountHolder);
    setAdminPin(config.adminPin);
  }, [config]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}$/.test(adminPin)) {
      alert("관리자 PIN은 4자리 숫자여야 합니다.");
      return;
    }
    await setConfig({
      deadline: deadlineLocal ? localInputToKSTISOString(deadlineLocal) : "",
      bankInfo: { bankName, accountNumber, accountHolder },
      adminPin,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-5 rounded-lg border border-stone-200 p-4">
      <div>
        <label htmlFor="deadline" className="mb-1 block text-sm text-stone-900">마감 시간 (한국 표준시 기준)</label>
        <input
          id="deadline"
          type="datetime-local"
          value={deadlineLocal}
          onChange={(e) => setDeadlineLocal(e.target.value)}
          className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm sm:w-64"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="bank-name" className="mb-1 block text-sm text-stone-900">은행명</label>
          <input
            id="bank-name"
            value={bankName}
            onChange={(e) => setBankName(e.target.value)}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="account-number" className="mb-1 block text-sm text-stone-900">계좌번호</label>
          <input
            id="account-number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="account-holder" className="mb-1 block text-sm text-stone-900">예금주</label>
          <input
            id="account-holder"
            value={accountHolder}
            onChange={(e) => setAccountHolder(e.target.value)}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label htmlFor="admin-pin" className="mb-1 block text-sm text-stone-900">관리자 PIN (4자리 숫자)</label>
        <input
          id="admin-pin"
          inputMode="numeric"
          maxLength={4}
          value={adminPin}
          onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
          className="w-32 rounded-md border border-stone-300 px-3 py-2 text-sm"
        />
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800">
          설정 저장
        </button>
        {saved && <span className="text-sm text-green-600">저장되었습니다.</span>}
      </div>
    </form>
  );
}
