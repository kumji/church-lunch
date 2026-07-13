import type { Order } from "./types";

const STATUS_LABEL: Record<string, string> = {
  none: "미입금",
  pending: "확인요청",
  confirmed: "입금완료",
};

function escapeCsvField(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function ordersToCsv(orders: Order[]): string {
  const header = ["이름", "휴대폰 뒷자리", "메뉴명", "수량", "총 주문 금액", "입금 상태"];
  const rows: string[] = [header.map(escapeCsvField).join(",")];

  for (const order of orders) {
    const menuNames = order.items.map((i) => i.menuName).join(" / ");
    const qtys = order.items.map((i) => i.qty).join(" / ");
    rows.push(
      [
        escapeCsvField(order.name),
        escapeCsvField(order.phoneLast4),
        escapeCsvField(menuNames),
        escapeCsvField(qtys),
        escapeCsvField(order.totalAmount),
        escapeCsvField(STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus),
      ].join(",")
    );
  }

  return "﻿" + rows.join("\n");
}

export function downloadCsv(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
