"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CountdownTimer from "@/components/CountdownTimer";
import { getConfig, subscribeConfig } from "@/lib/settings";
import { setAdminAuthed } from "@/lib/session";

export default function AdminLoginPage() {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(false);
  const [deadline, setDeadline] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeConfig((config) => {
      setDeadline(config?.deadline || null);
    });
    return unsub;
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\d{4}$/.test(pin)) {
      setError("4자리 숫자 PIN을 입력해주세요.");
      return;
    }
    setChecking(true);
    setError("");
    try {
      const config = await getConfig();
      if (config && config.adminPin === pin) {
        setAdminAuthed();
        router.push("/admin/dashboard");
      } else {
        setError("번호가 맞지 않습니다.");
      }
    } catch {
      setError("설정을 불러오지 못했습니다. 다시 시도해주세요.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-amber-50">
      <CountdownTimer deadline={deadline} />
      <div className="flex w-full flex-1 flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-sm">
          <p className="mb-1 text-center text-sm font-medium text-amber-800">광림교회 청장2부</p>
          <h1 className="mb-1 text-center text-2xl font-bold">관리자 모드</h1>
          <p className="mb-6 text-center text-base text-stone-900">4자리 숫자 PIN을 입력해주세요.</p>

          <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3">
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              className="w-40 rounded-lg border-2 border-stone-300 px-4 py-3 text-center text-lg tracking-[0.5em] outline-none focus:border-stone-500"
              placeholder="••••"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={checking}
              className="mt-2 w-40 rounded-lg bg-amber-700 py-3 text-base font-medium text-white hover:bg-amber-800 disabled:opacity-50"
            >
              {checking ? "확인 중..." : "확인"}
            </button>
          </form>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="mt-6 w-full text-center text-base text-stone-900 hover:text-stone-600"
          >
            처음으로
          </button>
        </div>
      </div>
    </div>
  );
}
