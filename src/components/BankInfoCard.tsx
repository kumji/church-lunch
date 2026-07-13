import type { BankInfo } from "@/lib/types";

export default function BankInfoCard({ bankInfo }: { bankInfo: BankInfo }) {
  if (!bankInfo.bankName && !bankInfo.accountNumber) return null;

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-stone-800">
      <p className="font-semibold mb-1">입금 계좌 정보</p>
      <p>
        {bankInfo.bankName} {bankInfo.accountNumber} ({bankInfo.accountHolder})
      </p>
    </div>
  );
}
