"use client";

import { useState } from "react";
import type { BankInfo } from "@/lib/types";

export default function BankInfoCard({ bankInfo }: { bankInfo: BankInfo }) {
  const [copied, setCopied] = useState(false);

  if (!bankInfo.bankName && !bankInfo.accountNumber) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(bankInfo.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 클립보드 접근 실패 시 별도 처리 없이 무시한다.
    }
  }

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-stone-800">
      <p className="font-semibold mb-1">입금 계좌 정보</p>
      <div className="flex items-center justify-between gap-3">
        <p>
          {bankInfo.bankName} {bankInfo.accountNumber} ({bankInfo.accountHolder})
        </p>
        <button
          type="button"
          onClick={handleCopy}
          className="shrink-0 rounded-md border border-amber-400 bg-white px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-100"
        >
          {copied ? "복사됨" : "계좌 복사"}
        </button>
      </div>
    </div>
  );
}
