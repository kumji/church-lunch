import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// 모든 lib/*.ts가 모듈 최상단에서 collection()/doc() 등을 호출하므로,
// 실제 Firebase 프로젝트 없이도 임포트가 안전하도록 전역으로 스텁을 깔아둔다.
// 각 테스트 파일은 필요에 따라 firebase/firestore의 개별 함수를 다시 모킹해서 쓴다.
vi.mock("firebase/app", () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({})),
}));

vi.mock("firebase/firestore", () => ({
  getFirestore: vi.fn(() => ({})),
  collection: vi.fn(() => ({})),
  doc: vi.fn(() => ({})),
  addDoc: vi.fn(() => Promise.resolve({ id: "new-id" })),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => undefined })),
  getDocs: vi.fn(() => Promise.resolve({ empty: true, docs: [] })),
  onSnapshot: vi.fn(() => () => {}),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  deleteField: vi.fn(() => "DELETE_FIELD_SENTINEL"),
  query: vi.fn(() => ({})),
  where: vi.fn(() => ({})),
  serverTimestamp: vi.fn(() => "SERVER_TIMESTAMP_SENTINEL"),
  writeBatch: vi.fn(() => ({ delete: vi.fn(), commit: vi.fn(() => Promise.resolve()) })),
}));
