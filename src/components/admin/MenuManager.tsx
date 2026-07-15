"use client";

import { useEffect, useState } from "react";
import { addMenu, deleteMenu, updateMenu } from "@/lib/menus";
import { resizeImageToDataUrl } from "@/lib/image";
import {
  addMenuTemplate,
  deleteMenuTemplate,
  reconcileMenuTemplates,
  subscribeMenuTemplates,
  type MenuTemplate,
} from "@/lib/menuTemplates";
import type { Menu, NewMenu } from "@/lib/types";

const emptyForm: NewMenu = { name: "", price: 0, imgUrl: "" };

export default function MenuManager({ menus }: { menus: Menu[] }) {
  const [form, setForm] = useState<NewMenu>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [imageError, setImageError] = useState("");
  const [templates, setTemplates] = useState<MenuTemplate[]>([]);

  useEffect(() => {
    return subscribeMenuTemplates(setTemplates);
  }, []);

  useEffect(() => {
    if (templates.length > 0) {
      reconcileMenuTemplates(menus, templates);
    }
  }, [menus, templates]);

  function startEdit(menu: Menu) {
    setEditingId(menu.id);
    setForm({ name: menu.name, price: menu.price, imgUrl: menu.imgUrl });
    setImageError("");
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setImageError("");
  }

  async function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImageError("");
    setProcessingImage(true);
    try {
      const dataUrl = await resizeImageToDataUrl(file);
      setForm((f) => ({ ...f, imgUrl: dataUrl }));
    } catch {
      setImageError("이미지를 처리하지 못했습니다. 다른 사진으로 시도해주세요.");
    } finally {
      setProcessingImage(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || form.price < 0) return;
    setSaving(true);
    if (editingId) {
      await updateMenu(editingId, form);
    } else {
      await addMenu(form);
    }
    setSaving(false);
    resetForm();
  }

  async function handleDelete(id: string) {
    if (!confirm("메뉴를 삭제하시겠습니까?")) return;
    await deleteMenu(id);
    if (editingId === id) resetForm();
  }

  async function handleRemember(menu: Menu) {
    await addMenuTemplate({ name: menu.name, price: menu.price, imgUrl: menu.imgUrl, sourceMenuId: menu.id });
  }

  async function handleAddFromTemplate(template: MenuTemplate) {
    await addMenu({ name: template.name, price: template.price, imgUrl: template.imgUrl });
  }

  async function handleDeleteTemplate(id: string) {
    if (!confirm("기억해둔 메뉴를 삭제하시겠습니까?")) return;
    await deleteMenuTemplate(id);
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-stone-200 p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1 block text-sm text-stone-900">메뉴명</label>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="w-full sm:w-32">
          <label className="mb-1 block text-sm text-stone-900">가격</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="0"
            value={form.price === 0 ? "" : form.price}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, "");
              setForm((f) => ({ ...f, price: digits === "" ? 0 : Number(digits) }));
            }}
            className="w-full rounded-md border border-stone-300 px-3 py-2 text-sm"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-sm text-stone-900">이미지</label>
          <div className="flex items-center gap-3">
            {form.imgUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- 업로드 직후 리사이즈된 data URL 미리보기라 next/image 최적화 대상이 아님
              <img src={form.imgUrl} alt="" className="h-12 w-12 rounded object-cover" />
            ) : (
              <div className="h-12 w-12 shrink-0 rounded bg-stone-100" />
            )}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="flex-1 text-sm"
            />
          </div>
          {processingImage && <p className="mt-1 text-sm text-stone-900">이미지 처리 중...</p>}
          {imageError && <p className="mt-1 text-sm text-red-600">{imageError}</p>}
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving || processingImage}
            className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:opacity-50"
          >
            {editingId ? "수정 저장" : "추가"}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="rounded-md border border-stone-300 px-4 py-2 text-sm">
              취소
            </button>
          )}
        </div>
      </form>

      <div>
        <p className="mb-2 text-sm font-medium text-stone-900">현재 등록된 메뉴</p>
        <ul className="divide-y divide-stone-100 rounded-lg border-2 border-amber-200 bg-amber-50/40">
          {menus.length === 0 && <li className="p-4 text-sm text-stone-900">등록된 메뉴가 없습니다.</li>}
          {menus.map((menu) => (
            <li key={menu.id} className="flex items-center justify-between gap-3 p-3">
              <div className="flex items-center gap-3">
                {menu.imgUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- 저장된 data URL 썸네일이라 next/image 최적화 대상이 아님
                  <img src={menu.imgUrl} alt="" className="h-12 w-12 rounded object-cover" />
                ) : (
                  <div className="h-12 w-12 shrink-0 rounded bg-stone-100" />
                )}
                <div>
                  <p className="font-medium">{menu.name}</p>
                  <p className="text-sm text-stone-900">{menu.price.toLocaleString()}원</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleRemember(menu)} className="rounded-md border border-stone-300 px-3 py-1.5 text-sm">
                  기억하기
                </button>
                <button onClick={() => startEdit(menu)} className="rounded-md border border-stone-300 px-3 py-1.5 text-sm">
                  수정
                </button>
                <button
                  onClick={() => handleDelete(menu.id)}
                  className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600"
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="mb-2 text-sm text-stone-900">기억해둔 메뉴 (클릭 한 번으로 추가)</p>
        {templates.length === 0 ? (
          <p className="rounded-lg border border-stone-200 p-4 text-sm text-stone-900">
            아직 기억해둔 메뉴가 없습니다. 위 목록에서 “기억하기”를 눌러 자주 쓰는 메뉴를 저장해보세요.
          </p>
        ) : (
          <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200">
            {templates.map((template) => (
              <li key={template.id} className="flex items-center justify-between gap-3 p-3">
                <div className="flex items-center gap-3">
                  {template.imgUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- 저장된 data URL 썸네일이라 next/image 최적화 대상이 아님
                    <img src={template.imgUrl} alt="" className="h-12 w-12 rounded object-cover" />
                  ) : (
                    <div className="h-12 w-12 shrink-0 rounded bg-stone-100" />
                  )}
                  <div>
                    <p className="font-medium">{template.name}</p>
                    <p className="text-sm text-stone-900">{template.price.toLocaleString()}원</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAddFromTemplate(template)}
                    className="rounded-md bg-amber-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-800"
                  >
                    추가
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-600"
                  >
                    삭제
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
