import { describe, expect, it } from "vitest";
import { isDuplicateMenuName } from "./menus";
import type { Menu } from "./types";

const menus: Menu[] = [
  { id: "m1", name: "김밥", price: 3000, imgUrl: "" },
  { id: "m2", name: "라면", price: 4000, imgUrl: "" },
];

describe("isDuplicateMenuName", () => {
  it("이미 존재하는 이름이면 true를 반환한다", () => {
    expect(isDuplicateMenuName(menus, "김밥")).toBe(true);
  });

  it("존재하지 않는 이름이면 false를 반환한다", () => {
    expect(isDuplicateMenuName(menus, "떡볶이")).toBe(false);
  });

  it("앞뒤 공백은 무시하고 비교한다", () => {
    expect(isDuplicateMenuName(menus, "  김밥  ")).toBe(true);
  });

  it("excludeId로 자기 자신은 중복 검사에서 제외한다 (수정 시)", () => {
    expect(isDuplicateMenuName(menus, "김밥", "m1")).toBe(false);
    expect(isDuplicateMenuName(menus, "라면", "m1")).toBe(true);
  });
});
