"use client";

import { useEffect, useState } from "react";
import { formatCountdown, formatDeadlineKST, remainingMs } from "@/lib/time";

export default function CountdownTimer({ deadline }: { deadline: string | null }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!deadline) {
    return (
      <div className="sticky top-0 z-50 w-full bg-amber-800 text-stone-100 text-center py-2 text-sm">
        마감 시간이 아직 설정되지 않았습니다.
      </div>
    );
  }

  const ms = remainingMs(deadline, new Date(now));
  const isOver = ms <= 0;
  const isNearDeadline = !isOver && ms <= 10 * 60 * 1000;

  return (
    <div
      className={`sticky top-0 z-50 w-full text-center py-2 text-sm font-medium ${
        isOver || isNearDeadline ? "bg-red-700 text-white" : "bg-amber-800 text-white"
      }`}
    >
      {isOver ? (
        <span>마감되었습니다</span>
      ) : (
        <span>
          마감까지 남은 시간 · <span className="font-mono text-base">{formatCountdown(ms)}</span>
          <span className="ml-2 text-stone-300 hidden sm:inline">
            (마감: {formatDeadlineKST(deadline)})
          </span>
        </span>
      )}
    </div>
  );
}
