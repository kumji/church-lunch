import Image from "next/image";
import { menuQtyByMenuId } from "@/lib/orders";
import type { Menu, Order } from "@/lib/types";

export default function MenuOrderStats({ menus, orders }: { menus: Menu[]; orders: Order[] }) {
  const qtyByMenuId = menuQtyByMenuId(orders);
  const sortedMenus = [...menus].sort((a, b) => a.name.localeCompare(b.name, "ko"));

  if (sortedMenus.length === 0) {
    return <p className="text-center text-sm text-stone-900">아직 메뉴가 준비되지 않았습니다.</p>;
  }

  return (
    <ul className="space-y-3">
      {sortedMenus.map((menu) => (
        <li key={menu.id} className="flex items-center gap-3 rounded-lg border border-stone-200 p-3">
          {menu.imgUrl ? (
            <Image
              src={menu.imgUrl}
              alt={menu.name}
              width={48}
              height={48}
              unoptimized
              className="h-12 w-12 shrink-0 rounded object-cover bg-stone-100"
            />
          ) : (
            <div className="h-12 w-12 shrink-0 rounded bg-stone-100" />
          )}
          <span className="flex-1 font-medium">{menu.name}</span>
          <span className="text-stone-900">{qtyByMenuId.get(menu.id) ?? 0}개</span>
        </li>
      ))}
    </ul>
  );
}
