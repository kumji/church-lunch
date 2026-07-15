import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { Menu, NewMenu } from "./types";

export interface NewMenuTemplate extends NewMenu {
  sourceMenuId?: string;
}

export interface MenuTemplate extends NewMenuTemplate {
  id: string;
}

const templatesCol = collection(db, "menuTemplates");

export function subscribeMenuTemplates(callback: (templates: MenuTemplate[]) => void) {
  return onSnapshot(templatesCol, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as NewMenuTemplate) })));
  });
}

export async function addMenuTemplate(template: NewMenuTemplate): Promise<string> {
  const ref = await addDoc(templatesCol, template);
  return ref.id;
}

export async function deleteMenuTemplate(id: string): Promise<void> {
  await deleteDoc(doc(db, "menuTemplates", id));
}

// 기억해둔 메뉴가 원본 메뉴(sourceMenuId)를 계속 가리키고 있는 동안,
// 원본이 수정되면 기억해둔 메뉴도 최신 이름/가격/이미지로 맞춰준다.
export async function reconcileMenuTemplates(menus: Menu[], templates: MenuTemplate[]): Promise<void> {
  const menuById = new Map(menus.map((m) => [m.id, m]));
  const writes: Promise<void>[] = [];

  for (const template of templates) {
    if (!template.sourceMenuId) continue;
    const menu = menuById.get(template.sourceMenuId);
    if (!menu) continue;
    if (
      menu.name !== template.name ||
      menu.price !== template.price ||
      menu.imgUrl !== template.imgUrl
    ) {
      writes.push(
        updateDoc(doc(db, "menuTemplates", template.id), {
          name: menu.name,
          price: menu.price,
          imgUrl: menu.imgUrl,
        })
      );
    }
  }

  await Promise.all(writes);
}
