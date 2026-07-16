import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Menu, NewOrder, Order, OrderItem, PaymentStatus } from "./types";

const ordersCol = collection(db, "orders");

export function calcTotal(items: OrderItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

// 입금 확인 이후 메뉴 가격이 바뀌어 totalAmount가 재계산된 경우의 차익.
// 아직 confirmedAmount가 없거나(미입금) 차익이 없으면 null.
export function amountDiff(order: Order): number | null {
  if (order.confirmedAmount === undefined) return null;
  const diff = order.totalAmount - order.confirmedAmount;
  return diff !== 0 ? diff : null;
}

export async function findOrderByIdentity(
  name: string,
  phoneLast4: string
): Promise<Order | null> {
  const q = query(
    ordersCol,
    where("name", "==", name),
    where("phoneLast4", "==", phoneLast4)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...(d.data() as Omit<Order, "id">) };
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  const snap = await getDoc(doc(db, "orders", orderId));
  return snap.exists() ? { id: snap.id, ...(snap.data() as Omit<Order, "id">) } : null;
}

export function subscribeOrders(callback: (orders: Order[]) => void) {
  return onSnapshot(ordersCol, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) })));
  });
}

export async function createOrder(order: NewOrder): Promise<string> {
  const snapshot = order.paymentStatus !== "none" ? { confirmedAmount: order.totalAmount } : {};
  const ref = await addDoc(ordersCol, { ...order, ...snapshot, createdAt: serverTimestamp() });
  return ref.id;
}

export async function updateOrderItems(
  orderId: string,
  items: OrderItem[]
): Promise<void> {
  await updateDoc(doc(db, "orders", orderId), {
    items,
    totalAmount: calcTotal(items),
  });
}

export async function deleteOrder(orderId: string): Promise<void> {
  await deleteDoc(doc(db, "orders", orderId));
}

// 관리자: 매주 운영 초기화용 - 모든 주문 문서를 삭제한다 (Firestore 배치 500건 제한 대응)
export async function deleteAllOrders(): Promise<void> {
  const snap = await getDocs(ordersCol);
  for (let i = 0; i < snap.docs.length; i += 500) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + 500).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

// 관리자: 입금 확인 처리 (none -> confirmed). 처음 확인되는 시점의 totalAmount를
// confirmedAmount로 남겨, 이후 가격 변동에 따른 차익을 계산할 수 있게 한다.
export async function setPaymentStatus(order: Order, status: PaymentStatus): Promise<void> {
  const snapshot =
    status === "confirmed" && order.confirmedAmount === undefined
      ? { confirmedAmount: order.totalAmount }
      : {};
  await updateDoc(doc(db, "orders", order.id), { paymentStatus: status, ...snapshot });
}

// 관리자: 입금 확인을 되돌려 다시 미입금 상태로 되돌린다. 다음에 다시 확인할 때
// 그 시점의 금액을 새로 기준선으로 잡도록 confirmedAmount도 함께 지운다.
export async function revertPaymentStatus(order: Order): Promise<void> {
  await updateDoc(doc(db, "orders", order.id), {
    paymentStatus: "none" as PaymentStatus,
    confirmedAmount: deleteField(),
  });
}

// 관리자: 대시보드가 열려 있는 동안 메뉴(이름/가격) 최신 값과 어긋난 주문 항목을
// 지속적으로 맞춰준다. 메뉴 저장 시점뿐 아니라 과거에 반영이 누락된 주문도
// 다음 로딩 때 자연히 복구된다.
// 가격이 바뀌어 총액이 달라지는데 이미 입금 확인되어 있고 아직
// confirmedAmount가 없는 주문은, 지금까지의 totalAmount를 기준선으로 남겨
// 이후 차익(totalAmount - confirmedAmount)을 화면에 표시할 수 있게 한다.
export async function reconcileOrdersWithMenus(orders: Order[], menus: Menu[]): Promise<void> {
  const menuById = new Map(menus.map((m) => [m.id, m]));
  const writes: Promise<void>[] = [];

  for (const order of orders) {
    let itemsChanged = false;
    const items = order.items.map((item) => {
      const menu = menuById.get(item.menuId);
      if (menu && (menu.name !== item.menuName || menu.price !== item.price)) {
        itemsChanged = true;
        return { ...item, menuName: menu.name, price: menu.price };
      }
      return item;
    });
    if (!itemsChanged) continue;

    const totalAmount = calcTotal(items);
    const patch: { items: OrderItem[]; totalAmount: number; confirmedAmount?: number } = {
      items,
      totalAmount,
    };
    if (
      order.paymentStatus !== "none" &&
      order.confirmedAmount === undefined &&
      totalAmount !== order.totalAmount
    ) {
      patch.confirmedAmount = order.totalAmount;
    }
    writes.push(updateDoc(doc(db, "orders", order.id), patch));
  }

  await Promise.all(writes);
}
