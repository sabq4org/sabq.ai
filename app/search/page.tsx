"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, Loader2, AlertTriangle, Hash, Calendar, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Article {
  id: string;
  title: string;
  summary?: string;
  slug?: string;
  featured_image?: string;
  published_at?: string;
  created_at?: string;
  category_name?: string;
  author_name?: string;
  reading_time?: number;
}

function SearchContent() {
  const params = useSearchParams();
  const query = params?.get("q") ?? "";
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState<Article[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/articles?keyword=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success) {
          setArticles(data.data || data.articles || []);
        } else {
          setError(data.error || "فشل البحث");
        }
      } catch (e: any) {
        setError("خطأ في الشبكة");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  return (
    <>
      <Header />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between gap-3 mb-6 border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 flex items-center justify-center rounded-xl">
              <Hash className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">نتائج البحث عن الكلمة المفتاحية</p>
              <h1 className="text-2xl font-bold text-gray-800">{query}</h1>
            </div>
          </div>
          <Link href="/" className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
            <ArrowLeft className="w-4 h-4" />
            العودة للرئيسية
          </Link>
        </div>

        {loading && (
          <div className="text-center py-20">
            <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500" />
            <p className="mt-4 text-gray-600">جارٍ جلب المقالات...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-20 bg-red-50 p-6 rounded-xl">
            <AlertTriangle className="w-8 h-8 mx-auto text-red-500" />
            <p className="mt-4 text-red-700 font-semibold">{error}</p>
          </div>
        )}

        {!loading && !error && articles.length === 0 && (
          <div className="text-center py-20 bg-gray-50 p-6 rounded-xl">
            <Search className="w-8 h-8 mx-auto text-gray-400" />
            <p className="mt-4 text-gray-600">
              لم يتم العثور على مقالات تحتوي على الكلمة المفتاحية "{query}".
            </p>
          </div>
        )}

        {!loading && articles.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <Link
                key={article.id}
                href={`/article/${article.id}`}
                className="group block bg-white border rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative">
                  <img
                    src={article.featured_image || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=800&q=80'}
                    alt={article.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 bg-blue-600 text-white text-xs font-semibold rounded-full">
                    {article.category_name || 'أخبار'}
                  </div>
                </div>
                <div className="p-5">
                  <h2 className="font-bold text-lg mb-2 text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {article.title}
                  </h2>
                  <p className="text-sm text-gray-600 line-clamp-3 mb-4">
                    {article.summary}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(article.published_at || article.created_at || Date.now()).toLocaleDateString('ar-SA')}
                    </span>
                    <span className="font-semibold text-blue-500">
                      اقرأ المزيد &larr;
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-blue-500" />
          <p className="mt-4 text-gray-600">جارٍ التحميل...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
} 