"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import CountdownTimer from "@/components/CountdownTimer";
import { saveIdentity } from "@/lib/session";
import { subscribeConfig } from "@/lib/settings";
import { isPastDeadline } from "@/lib/time";
import { validateEntryForm } from "@/lib/validation";

export default function EntryPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phoneLast4, setPhoneLast4] = useState("");
  const [error, setError] = useState("");
  const [closed, setClosed] = useState(false);
  const [deadline, setDeadline] = useState<string | null>(null);

  useEffect(() => {
    const unsub = subscribeConfig((config) => {
      setClosed(config?.deadline ? isPastDeadline(config.deadline) : false);
      setDeadline(config?.deadline || null);
    });
    return unsub;
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validateEntryForm(name, phoneLast4);
    if (validationError) {
      setError(validationError);
      return;
    }

    saveIdentity({ name: name.trim(), phoneLast4 });
    router.push("/order");
  }

  return (
    <div
      className="relative flex min-h-screen flex-col items-center bg-stone-900 bg-cover bg-no-repeat"
      style={{ backgroundImage: "url('/images/hero-church-lunch.jpg')", backgroundPosition: "78% 20%" }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/5 to-black/40" />

      <div className="relative z-10 flex w-full flex-1 flex-col items-center">
        <CountdownTimer deadline={deadline} />
        <div className="flex w-full flex-1 flex-col items-center justify-center px-4 py-10">
          <div className="w-full max-w-sm rounded-xl bg-white/90 p-8 shadow-lg backdrop-blur-sm">
            <div className="mb-4 flex justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
                <svg viewBox="0 0 24 24" className="h-7 w-7 text-amber-700" fill="currentColor" aria-hidden="true">
                  <path d="M11 2h2v7h7v2h-7v11h-2V11H4V9h7V2z" />
                </svg>
              </div>
            </div>
            <p className="mb-1 text-center text-sm font-medium text-amber-800">광림교회 청장2부</p>
            <h1 className="mb-1 text-center text-2xl font-bold">애찬 주문</h1>
            <p className="mb-6 text-center text-base text-stone-900">
              이름과 휴대폰 번호 뒷자리 4자리를 입력해주세요.
            </p>

            {closed && (
              <p className="mb-4 text-center text-sm font-medium text-red-600">
                마감 시간이 지나 신규 주문은 불가하며, 본인 주문 내역 확인만 가능합니다.
              </p>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3">
              <input
                type="text"
                placeholder="이름"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-14 w-48 rounded-lg border-2 border-stone-300 px-4 text-center text-lg font-medium outline-none focus:border-stone-500"
              />
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                placeholder="0000"
                value={phoneLast4}
                onChange={(e) => setPhoneLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
                className="h-14 w-48 rounded-lg border-2 border-stone-300 px-4 text-center text-lg font-medium tracking-[0.3em] outline-none focus:border-stone-500"
              />

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                className="mt-2 flex h-14 w-48 items-center justify-center rounded-lg bg-amber-700 text-lg font-medium text-white hover:bg-amber-800"
              >
                확인
              </button>
            </form>

            <button
              type="button"
              onClick={() => router.push("/admin")}
              className="mt-6 w-full text-center text-base text-stone-900 hover:text-stone-600"
            >
              관리자 모드
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
