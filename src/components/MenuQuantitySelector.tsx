import Image from "next/image";
import type { Menu } from "@/lib/types";

interface Props {
  menus: Menu[];
  quantities: Record<string, number>;
  onChange: (menuId: string, qty: number) => void;
  disabled?: boolean;
  rankByMenuId?: Map<string, 1 | 2>;
}

const RANK_LABEL: Record<1 | 2, string> = { 1: "1위", 2: "2위" };

export default function MenuQuantitySelector({ menus, quantities, onChange, disabled, rankByMenuId }: Props) {
  if (menus.length === 0) {
    return <p className="text-stone-900 text-center py-8">아직 메뉴가 준비되지 않았습니다.</p>;
  }

  return (
    <ul className="space-y-3">
      {menus.map((menu) => {
        const qty = quantities[menu.id] ?? 0;
        const rank = rankByMenuId?.get(menu.id);
        return (
          <li
            key={menu.id}
            className="flex items-center gap-3 rounded-lg border border-stone-200 p-3"
          >
            <div className="relative shrink-0">
              {menu.imgUrl ? (
                <Image
                  src={menu.imgUrl}
                  alt={menu.name}
                  width={64}
                  height={64}
                  unoptimized
                  className="h-16 w-16 rounded object-cover bg-stone-100"
                />
              ) : (
                <div className="h-16 w-16 rounded bg-stone-100" />
              )}
              {rank && (
                <span className="absolute -left-1.5 -top-1.5 rounded-full bg-amber-700 px-1.5 py-0.5 text-[10px] font-bold text-white shadow">
                  {RANK_LABEL[rank]}
                </span>
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">{menu.name}</p>
              <p className="text-sm text-stone-900">{menu.price.toLocaleString()}원</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={disabled || qty <= 0}
                onClick={() => onChange(menu.id, Math.max(0, qty - 1))}
                className="h-8 w-8 rounded-full border border-stone-300 disabled:opacity-40"
              >
                −
              </button>
              <span className="w-6 text-center">{qty}</span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(menu.id, qty + 1)}
                className="h-8 w-8 rounded-full border border-stone-300 disabled:opacity-40"
              >
                +
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
