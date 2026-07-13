import { doc, getDoc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { Config } from "./types";

const configRef = doc(db, "settings", "config");

export const DEFAULT_CONFIG: Config = {
  deadline: "",
  bankInfo: { bankName: "", accountNumber: "", accountHolder: "" },
  adminPin: "0000",
};

export async function getConfig(): Promise<Config | null> {
  const snap = await getDoc(configRef);
  return snap.exists() ? (snap.data() as Config) : null;
}

export function subscribeConfig(callback: (config: Config | null) => void) {
  return onSnapshot(configRef, (snap) => {
    callback(snap.exists() ? (snap.data() as Config) : null);
  });
}

export async function setConfig(config: Partial<Config>): Promise<void> {
  await setDoc(configRef, config, { merge: true });
}
