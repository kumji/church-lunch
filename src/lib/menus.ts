import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Menu, NewMenu } from "./types";

const menusCol = collection(db, "menus");

export async function getMenus(): Promise<Menu[]> {
  const snap = await getDocs(menusCol);
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as NewMenu) }));
}

export function subscribeMenus(callback: (menus: Menu[]) => void) {
  return onSnapshot(menusCol, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as NewMenu) })));
  });
}

export async function addMenu(menu: NewMenu): Promise<string> {
  const ref = await addDoc(menusCol, menu);
  return ref.id;
}

export async function updateMenu(id: string, menu: Partial<NewMenu>): Promise<void> {
  await updateDoc(doc(db, "menus", id), menu);
}

export async function deleteMenu(id: string): Promise<void> {
  await deleteDoc(doc(db, "menus", id));
}

export function isDuplicateMenuName(menus: Menu[], name: string, excludeId?: string): boolean {
  const trimmed = name.trim();
  return menus.some((m) => m.id !== excludeId && m.name === trimmed);
}
