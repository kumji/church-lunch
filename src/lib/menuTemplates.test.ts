import { describe, expect, it, vi, beforeEach } from "vitest";
import { updateDoc } from "firebase/firestore";
import { reconcileMenuTemplates } from "./menuTemplates";
import type { MenuTemplate } from "./menuTemplates";
import type { Menu } from "./types";

describe("reconcileMenuTemplates", () => {
  beforeEach(() => {
    vi.mocked(updateDoc).mockClear();
  });

  it("원본 메뉴가 수정되면 연결된 기억해둔 메뉴도 함께 갱신된다", async () => {
    const menus: Menu[] = [{ id: "m1", name: "꼬마김밥", price: 3500, imgUrl: "" }];
    const templates: MenuTemplate[] = [
      { id: "t1", name: "김밥", price: 3000, imgUrl: "", sourceMenuId: "m1" },
    ];

    await reconcileMenuTemplates(menus, templates);

    expect(updateDoc).toHaveBeenCalledTimes(1);
    const patch = vi.mocked(updateDoc).mock.calls[0][1] as unknown as Record<string, unknown>;
    expect(patch).toEqual({ name: "꼬마김밥", price: 3500, imgUrl: "" });
  });

  it("원본 메뉴가 삭제되어 더 이상 없으면 기억해둔 메뉴는 그대로 유지된다", async () => {
    const templates: MenuTemplate[] = [
      { id: "t1", name: "김밥", price: 3000, imgUrl: "", sourceMenuId: "m1" },
    ];

    await reconcileMenuTemplates([], templates);

    expect(updateDoc).not.toHaveBeenCalled();
  });

  it("변경 사항이 없으면 갱신하지 않는다", async () => {
    const menus: Menu[] = [{ id: "m1", name: "김밥", price: 3000, imgUrl: "" }];
    const templates: MenuTemplate[] = [
      { id: "t1", name: "김밥", price: 3000, imgUrl: "", sourceMenuId: "m1" },
    ];

    await reconcileMenuTemplates(menus, templates);

    expect(updateDoc).not.toHaveBeenCalled();
  });
});
