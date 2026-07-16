export function validateEntryForm(name: string, phoneLast4: string): string | null {
  const trimmedName = name.trim();
  if (!trimmedName) return "이름을 입력해주세요.";
  if (trimmedName.length >= 5) return "이름을 5글자 미만으로 작성해주세요.";
  if (!/^\d{4}$/.test(phoneLast4)) return "뒷자리를 정확하게 입력해주세요.";
  return null;
}
