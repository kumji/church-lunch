import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import type { Config } from "./types";

const configRef = doc(db, "settings", "config");

export const DEFAULT_CONFIG: Config = {
  deadline: "",
  bankInfo: { bankName: "", accountNumber: "", accountHolder: "" },
  adminPin: "0000",
};

export function getConfig(): Promise<Config | null> {
  return new Promise((resolve) => {
    const unsubscribe = onSnapshot(
      configRef,
      (snap) => {
        unsubscribe();
        resolve(snap.exists() ? (snap.data() as Config) : null);
      },
      () => {
        unsubscribe();
        resolve(null);
      }
    );
  });
}

export function subscribeConfig(callback: (config: Config | null) => void) {
  return onSnapshot(configRef, (snap) => {
    callback(snap.exists() ? (snap.data() as Config) : null);
  });
}

export async function setConfig(config: Partial<Config>): Promise<void> {
  await setDoc(configRef, config, { merge: true });
}
