import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import MenuManager from "./MenuManager";
import { addMenu, deleteMenu, updateMenu } from "@/lib/menus";
import { addMenuTemplate } from "@/lib/menuTemplates";
import type { Menu } from "@/lib/types";
import type { MenuTemplate } from "@/lib/menuTemplates";

vi.mock("@/lib/menus", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/menus")>();
  return { ...actual, addMenu: vi.fn(), updateMenu: vi.fn(), deleteMenu: vi.fn() };
});

let templates: MenuTemplate[] = [];
vi.mock("@/lib/menuTemplates", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/menuTemplates")>();
  return {
    ...actual,
    addMenuTemplate: vi.fn(),
    deleteMenuTemplate: vi.fn(),
    reconcileMenuTemplates: vi.fn(),
    subscribeMenuTemplates: vi.fn((cb: (t: MenuTemplate[]) => void) => {
      cb(templates);
      return () => {};
    }),
  };
});

const kimbap: Menu = { id: "m1", name: "김밥", price: 3000, imgUrl: "" };

describe("MenuManager 메뉴 추가/수정/삭제", () => {
  beforeEach(() => {
    templates = [];
    vi.mocked(addMenu).mockClear();
    vi.mocked(updateMenu).mockClear();
    vi.mocked(deleteMenu).mockClear();
    vi.mocked(addMenuTemplate).mockClear();
  });

  it("새로운 메뉴를 중복 없이 추가할 수 있다", () => {
    render(<MenuManager menus={[kimbap]} />);

    fireEvent.change(screen.getByLabelText("메뉴명"), { target: { value: "라면" } });
    fireEvent.change(screen.getByLabelText("가격"), { target: { value: "4000" } });
    fireEvent.click(screen.getByRole("button", { name: "추가" }));

    expect(addMenu).toHaveBeenCalledWith({ name: "라면", price: 4000, imgUrl: "" });
  });

  it("이미 등록된 이름으로는 메뉴를 추가할 수 없다", () => {
    render(<MenuManager menus={[kimbap]} />);

    fireEvent.change(screen.getByLabelText("메뉴명"), { target: { value: "김밥" } });
    fireEvent.change(screen.getByLabelText("가격"), { target: { value: "3500" } });
    fireEvent.click(screen.getByRole("button", { name: "추가" }));

    expect(addMenu).not.toHaveBeenCalled();
    expect(screen.getByText("이미 등록된 메뉴입니다.")).toBeInTheDocument();
  });

  it("등록된 메뉴를 수정할 수 있다", () => {
    render(<MenuManager menus={[kimbap]} />);

    fireEvent.click(screen.getByRole("button", { name: "수정" }));
    fireEvent.change(screen.getByLabelText("가격"), { target: { value: "3500" } });
    fireEvent.click(screen.getByRole("button", { name: "수정 저장" }));

    expect(updateMenu).toHaveBeenCalledWith("m1", { name: "김밥", price: 3500, imgUrl: "" });
  });

  it("등록된 메뉴를 삭제할 수 있다", () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<MenuManager menus={[kimbap]} />);

    fireEvent.click(screen.getByRole("button", { name: "삭제" }));

    expect(deleteMenu).toHaveBeenCalledWith("m1");
  });

  it("메뉴를 자주 주문하는 메뉴(기억해둔 메뉴)로 등록할 수 있다", () => {
    render(<MenuManager menus={[kimbap]} />);

    fireEvent.click(screen.getByRole("button", { name: "기억" }));

    expect(addMenuTemplate).toHaveBeenCalledWith({
      name: "김밥",
      price: 3000,
      imgUrl: "",
      sourceMenuId: "m1",
    });
  });

  it("이미 등록된 메뉴와 이름이 같은 기억해둔 메뉴는 추가할 때 중복으로 생성되지 않는다", () => {
    templates = [{ id: "t1", name: "김밥", price: 3000, imgUrl: "", sourceMenuId: "m1" }];
    render(<MenuManager menus={[kimbap]} />);

    const templatesSection = screen.getByText(/기억해둔 메뉴/).closest("div") as HTMLElement;
    fireEvent.click(within(templatesSection).getByRole("button", { name: "추가" }));

    expect(addMenu).not.toHaveBeenCalled();
    expect(screen.getByText("이미 등록된 메뉴입니다 (김밥).")).toBeInTheDocument();
  });

  it("기억해둔 메뉴와 이름이 겹치지 않으면 정상적으로 추가된다", () => {
    templates = [{ id: "t1", name: "떡볶이", price: 5000, imgUrl: "", sourceMenuId: "m2" }];
    render(<MenuManager menus={[kimbap]} />);

    const templatesSection = screen.getByText(/기억해둔 메뉴/).closest("div") as HTMLElement;
    fireEvent.click(within(templatesSection).getByRole("button", { name: "추가" }));

    expect(addMenu).toHaveBeenCalledWith({ name: "떡볶이", price: 5000, imgUrl: "" });
  });

  it("현재 등록된 메뉴 목록이 이름 가나다 오름차순으로 정렬되어 보인다", () => {
    const unsortedMenus: Menu[] = [
      { id: "m1", name: "라면", price: 4000, imgUrl: "" },
      { id: "m2", name: "김밥", price: 3000, imgUrl: "" },
      { id: "m3", name: "떡볶이", price: 5000, imgUrl: "" },
    ];
    render(<MenuManager menus={unsortedMenus} />);

    const currentMenuList = screen.getByText("현재 등록된 메뉴").closest("div") as HTMLElement;
    const items = within(currentMenuList)
      .getAllByRole("listitem")
      .map((li) => li.textContent);

    expect(items[0]).toContain("김밥");
    expect(items[1]).toContain("떡볶이");
    expect(items[2]).toContain("라면");
  });
});
