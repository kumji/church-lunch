const KST_TIME_ZONE = "Asia/Seoul";

export function isPastDeadline(deadlineISO: string, now: Date = new Date()): boolean {
  return now.getTime() >= new Date(deadlineISO).getTime();
}

export function remainingMs(deadlineISO: string, now: Date = new Date()): number {
  return new Date(deadlineISO).getTime() - now.getTime();
}

export function formatCountdown(ms: number): string {
  if (ms <= 0) return "마감되었습니다";

  const totalSeconds = Math.floor(ms / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");

  if (days > 0) {
    return `${days}일 ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function formatDeadlineKST(deadlineISO: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: KST_TIME_ZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(deadlineISO));
}

// datetime-local 입력값(로컬 문자열)을 KST(+09:00) 오프셋이 명시된 ISO 문자열로 변환
export function localInputToKSTISOString(localValue: string): string {
  // localValue 예: "2026-07-20T13:00" -> 이 값을 그대로 KST 시각으로 간주
  return `${localValue}:00+09:00`;
}

// KST ISO 문자열을 <input type="datetime-local"> 에 넣을 수 있는 형식으로 변환
export function kstISOToLocalInput(deadlineISO: string): string {
  const match = deadlineISO.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/);
  return match ? match[1] : "";
}
