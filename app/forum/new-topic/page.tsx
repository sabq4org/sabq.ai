"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, RadixSelect } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import "../forum.css";

export default function NewTopicPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category_id: ""
  });

  const categories = [
    { id: "d0c88ff1-5900-11f0-a1ee-d21c6796aa46", name: "نقاش عام", slug: "general" },
    { id: "d0c890f7-5900-11f0-a1ee-d21c6796aa46", name: "اقتراحات", slug: "requests" },
    { id: "d0c89216-5900-11f0-a1ee-d21c6796aa46", name: "مشاكل تقنية", slug: "bugs" },
    { id: "d0c892db-5900-11f0-a1ee-d21c6796aa46", name: "مساعدة", slug: "help" },
    { id: "d0c89393-5900-11f0-a1ee-d21c6796aa46", name: "إعلانات", slug: "announcements" }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.content || !formData.category_id) {
      alert("جميع الحقول مطلوبة");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/forum/topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer test-token" // مؤقتاً
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        router.push("/forum");
      } else {
        alert(data.error || "حدث خطأ في إنشاء الموضوع");
      }
    } catch (error) {
      console.error("Error creating topic:", error);
      alert("حدث خطأ في الاتصال");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/forum" className="flex items-center gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            <ArrowRight className="w-5 h-5" />
            <span>العودة للمنتدى</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">إنشاء موضوع جديد</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="category">الفئة</Label>
                <RadixSelect
                  value={formData.category_id}
                  onValueChange={(value: string) => setFormData({ ...formData, category_id: value })}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="اختر فئة الموضوع" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </RadixSelect>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title">عنوان الموضوع</Label>
                <Input
                  id="title"
                  placeholder="اكتب عنواناً واضحاً ومختصراً"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="text-right"
                  dir="rtl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">محتوى الموضوع</Label>
                <Textarea
                  id="content"
                  placeholder="اشرح موضوعك بالتفصيل..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="min-h-[200px] text-right"
                  dir="rtl"
                />
              </div>

              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "جاري النشر..." : "نشر الموضوع"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 