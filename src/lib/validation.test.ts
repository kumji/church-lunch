import { describe, expect, it } from "vitest";
import { validateEntryForm } from "./validation";

describe("validateEntryForm", () => {
  it("이름이 비어있으면 이름 입력 요청 메시지를 반환한다", () => {
    expect(validateEntryForm("", "1234")).toBe("이름을 입력해주세요.");
    expect(validateEntryForm("   ", "1234")).toBe("이름을 입력해주세요.");
  });

  it("이름이 5글자 이상이면 거부 메시지를 반환한다", () => {
    expect(validateEntryForm("홍길동전우치", "1234")).toBe(
      "이름을 5글자 미만으로 작성해주세요."
    );
    expect(validateEntryForm("가나다라마", "1234")).toBe(
      "이름을 5글자 미만으로 작성해주세요."
    );
  });

  it("이름이 4글자 이하이면 이름 검증은 통과한다", () => {
    expect(validateEntryForm("가나다라", "1234")).toBeNull();
  });

  it("휴대폰 뒷자리가 4자리 숫자가 아니면 거부 메시지를 반환한다", () => {
    expect(validateEntryForm("홍길동", "123")).toBe("뒷자리를 정확하게 입력해주세요.");
    expect(validateEntryForm("홍길동", "12345")).toBe("뒷자리를 정확하게 입력해주세요.");
    expect(validateEntryForm("홍길동", "abcd")).toBe("뒷자리를 정확하게 입력해주세요.");
  });

  it("이름과 전화번호가 모두 유효하면 null을 반환한다", () => {
    expect(validateEntryForm("홍길동", "1234")).toBeNull();
  });
});
