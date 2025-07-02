"use client";

import React, { useEffect, useState } from "react";
import { Search, Plus, Trash2, Edit3, Hash, BarChart3, RefreshCw } from "lucide-react";

interface Keyword {
  id: string;
  name: string;
  usageCount: number;
}

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Keyword | null>(null);
  const [nameInput, setNameInput] = useState("");

  const fetchKeywords = async () => {
    setLoading(true);
    const res = await fetch(`/api/keywords${search ? `?search=${encodeURIComponent(search)}` : ""}`);
    const data = await res.json();
    if (data.success) setKeywords(data.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchKeywords();
  }, [search]);

  const resetModal = () => {
    setEditing(null);
    setNameInput("");
  };

  const openAdd = () => {
    resetModal();
    setShowModal(true);
  };

  const openEdit = (kw: Keyword) => {
    setEditing(kw);
    setNameInput(kw.name);
    setShowModal(true);
  };

  const saveKeyword = async () => {
    if (!nameInput.trim()) return;
    if (editing) {
      await fetch(`/api/keywords?id=${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput })
      });
    } else {
      await fetch("/api/keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nameInput })
      });
    }
    setShowModal(false);
    fetchKeywords();
  };

  const deleteKeyword = async (id: string) => {
    if (!confirm("حذف الكلمة المفتاحية؟")) return;
    await fetch(`/api/keywords?id=${id}`, { method: "DELETE" });
    fetchKeywords();
  };

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        <Hash className="w-7 h-7 text-blue-600" /> إدارة الكلمات المفتاحية
      </h1>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white p-6 rounded-2xl shadow-md">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-6 h-6" />
            <div>
              <p className="text-sm opacity-80">إجمالي الكلمات</p>
              <h3 className="text-2xl font-bold">{keywords.length}</h3>
            </div>
          </div>
        </div>
      </div>

      {/* شريط البحث */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-full max-w-xs">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            className="w-full pl-4 pr-10 py-2 border rounded-xl focus:ring-2 focus:ring-blue-500"
            placeholder="بحث..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          onClick={openAdd}
          className="px-4 py-2 bg-blue-500 text-white rounded-xl flex items-center gap-2 hover:bg-blue-600"
        >
          <Plus className="w-4 h-4" /> إضافة كلمة
        </button>
        <button onClick={fetchKeywords} className="p-2 border rounded-xl hover:bg-gray-50">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* جدول */}
      {loading ? (
        <p>جارٍ التحميل...</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right">الكلمة</th>
                <th className="px-6 py-3 text-right">عدد الاستخدام</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {keywords.map((kw) => (
                <tr key={kw.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3">{kw.name}</td>
                  <td className="px-6 py-3">{kw.usageCount}</td>
                  <td className="px-6 py-3 flex gap-2">
                    <button
                      onClick={() => openEdit(kw)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-blue-600"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteKeyword(kw.id)}
                      className="p-2 rounded-lg hover:bg-gray-100 text-red-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Hash className="w-5 h-5" /> {editing ? "تعديل كلمة" : "إضافة كلمة"}
            </h2>
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              className="w-full px-4 py-3 border rounded-xl mb-4 focus:ring-2 focus:ring-blue-500"
              placeholder="أدخل الكلمة..."
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-xl border text-gray-600 hover:bg-gray-50"
              >
                إلغاء
              </button>
              <button
                onClick={saveKeyword}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
              >
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 