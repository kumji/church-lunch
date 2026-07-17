export const REQUEST_NOTE_MAX_LENGTH = 25;

export type PaymentStatus = "none" | "confirmed";

export const PAYMENT_STATUS_LABEL: Record<PaymentStatus, string> = {
  none: "미입금",
  confirmed: "입금 완료",
};

export interface OrderItem {
  menuId: string;
  menuName: string;
  price: number;
  qty: number;
}

export interface Order {
  id: string;
  name: string;
  phoneLast4: string;
  items: OrderItem[];
  totalAmount: number;
  // 입금완료 시점의 totalAmount 스냅샷. 이후 메뉴 가격이 바뀌어 totalAmount가
  // 재계산되어도 실제로 확인된 금액을 알 수 있도록 별도 보관한다.
  confirmedAmount?: number;
  paymentStatus: PaymentStatus;
  isAdminForced: boolean;
  createdAt?: number;
  // 주문 시 남긴 추가 요청 사항 (최대 25자). 없으면 빈 문자열이거나 필드 자체가 없다.
  requestNote?: string;
}

export type NewOrder = Omit<Order, "id" | "createdAt">;

export interface Menu {
  id: string;
  name: string;
  price: number;
  imgUrl: string;
}

export type NewMenu = Omit<Menu, "id">;

export interface BankInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

export interface Config {
  deadline: string; // ISO 8601 with +09:00 offset
  bankInfo: BankInfo;
  adminPin: string;
}

export interface Identity {
  name: string;
  phoneLast4: string;
}
