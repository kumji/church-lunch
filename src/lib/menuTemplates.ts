import { addDoc, collection, deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { db } from "./firebase";
import type { NewMenu } from "./types";

export interface MenuTemplate extends NewMenu {
  id: string;
}

const templatesCol = collection(db, "menuTemplates");

export function subscribeMenuTemplates(callback: (templates: MenuTemplate[]) => void) {
  return onSnapshot(templatesCol, (snap) => {
    callback(snap.docs.map((d) => ({ id: d.id, ...(d.data() as NewMenu) })));
  });
}

export async function addMenuTemplate(template: NewMenu): Promise<string> {
  const ref = await addDoc(templatesCol, template);
  return ref.id;
}

export async function deleteMenuTemplate(id: string): Promise<void> {
  await deleteDoc(doc(db, "menuTemplates", id));
}
