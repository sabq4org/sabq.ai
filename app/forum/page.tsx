"use client";

import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, MessageSquare, ThumbsUp, Eye, Search, Plus, TrendingUp, MessageCircle, Users, Award, HelpCircle, Lightbulb, Hash, Clock, Pin } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import "./forum.css";

// تعريف أنواع البيانات
interface Topic {
  id: string;
  title: string;
  content: string;
  views: number;
  is_pinned: boolean;
  is_locked: boolean;
  is_featured: boolean;
  created_at: string;
  last_reply_at: string | null;
  category: {
    id: string;
    name: string;
    slug: string;
    color: string;
  };
  author: {
    id: string;
    name: string;
    avatar: string;
  };
  replies: number;
  likes: number;
  lastReply: string;
}

export default function SabqForum() {
  const [searchQuery, setSearchQuery] = useState("");
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");

  // جلب المواضيع من API
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedCategory !== 'all') params.append('category', selectedCategory);
        
        const response = await fetch(`/api/forum/topics?${params}`);
        const data = await response.json();
        
        if (data.topics) {
          setTopics(data.topics);
        }
      } catch (error) {
        console.error('Error fetching topics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [selectedCategory]);

  // تعريف الفئات
  const categories = [
    { id: 'all', name: 'جميع المواضيع', icon: Hash, color: 'bg-gray-500' },
    { id: 'general', name: 'نقاش عام', icon: MessageCircle, color: 'bg-blue-500' },
    { id: 'help', name: 'مساعدة ودعم', icon: HelpCircle, color: 'bg-green-500' },
    { id: 'requests', name: 'اقتراحات', icon: Lightbulb, color: 'bg-purple-500' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      {/* رأس الصفحة */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b dark:border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* العنوان */}
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex items-center gap-3">
                <MessageCircle className="w-10 h-10 text-blue-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">منتدى سبق</h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">مجتمع النقاش والحوار</p>
                </div>
              </div>
            </div>

            {/* أدوات البحث والإجراءات */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input 
                  placeholder="ابحث في المواضيع..." 
                  className="pr-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Button variant="ghost" size="icon" className="shrink-0">
                <Bell className="w-5 h-5" />
              </Button>
              
              <Link href="/forum/new-topic">
                <Button className="shrink-0">
                  <Plus className="w-5 h-5 ml-2" />
                  موضوع جديد
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* الشريط الجانبي - الفئات والإحصائيات */}
          <div className="lg:col-span-1 space-y-6">
            {/* الفئات */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">الفئات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => {
                  const Icon = category.icon;
                  return (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                        selectedCategory === category.id
                          ? 'bg-gray-100 dark:bg-gray-700'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                      }`}
                    >
                      <div className={`w-8 h-8 ${category.color} rounded-lg flex items-center justify-center text-white`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className={`flex-1 text-right font-medium ${
                        selectedCategory === category.id ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'
                      }`}>
                        {category.name}
                      </span>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* إحصائيات المنتدى */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">إحصائيات المنتدى</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">المواضيع</span>
                  <span className="font-bold text-gray-900 dark:text-white" dir="ltr">1,234</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">الردود</span>
                  <span className="font-bold text-gray-900 dark:text-white" dir="ltr">5,678</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">الأعضاء</span>
                  <span className="font-bold text-gray-900 dark:text-white" dir="ltr">892</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">الأعضاء النشطون</span>
                  <span className="font-bold text-green-600" dir="ltr">234</span>
                </div>
              </CardContent>
            </Card>

            {/* أفضل الأعضاء */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" />
                  أفضل الأعضاء
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: "أحمد الغامدي", points: 2450 },
                  { name: "سارة المالكي", points: 1850 },
                  { name: "محمد العتيبي", points: 1320 }
                ].map((user, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-2xl font-bold text-gray-400 w-8">{index + 1}</span>
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-sm">{user.name[0]}</AvatarFallback>
                    </Avatar>
                    <span className="flex-1 text-sm font-medium">{user.name}</span>
                    <span className="text-sm font-bold text-yellow-600" dir="ltr">{user.points}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* قائمة المواضيع */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {categories.find(c => c.id === selectedCategory)?.name || 'جميع المواضيع'}
              </h2>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600 dark:text-gray-400">محدث منذ دقيقة</span>
              </div>
            </div>

            {loading ? (
              // عرض التحميل
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        <div className="flex-1 space-y-3">
                          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : topics.length > 0 ? (
              <div className="space-y-4">
                {topics.map((topic) => (
                  <Card key={topic.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {/* صورة المؤلف */}
                        <Avatar className="w-12 h-12 shrink-0">
                          <AvatarFallback>{topic.author.name[0]}</AvatarFallback>
                        </Avatar>
                        
                        {/* محتوى الموضوع */}
                        <div className="flex-1 min-w-0">
                          {/* العنوان والفئة */}
                          <div className="flex items-start gap-3 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {topic.is_pinned && (
                                  <Pin className="w-4 h-4 text-orange-500" />
                                )}
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                  {topic.title}
                                </h3>
                              </div>
                              <Badge 
                                className={`${topic.category.color} text-white text-xs`}
                              >
                                {topic.category.name}
                              </Badge>
                            </div>
                          </div>

                          {/* معلومات المؤلف والوقت */}
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                            <span className="font-medium">{topic.author.name}</span>
                            <span>•</span>
                            <Clock className="w-3 h-3" />
                            <span>{topic.lastReply}</span>
                          </div>

                          {/* الإحصائيات */}
                          <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <MessageSquare className="w-4 h-4" />
                              <span className="font-medium" dir="ltr">{topic.replies}</span>
                              <span>رد</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <Eye className="w-4 h-4" />
                              <span className="font-medium" dir="ltr">{topic.views}</span>
                              <span>مشاهدة</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                              <ThumbsUp className="w-4 h-4" />
                              <span className="font-medium" dir="ltr">{topic.likes}</span>
                              <span>إعجاب</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400 text-lg">لا توجد مواضيع في هذه الفئة</p>
                  <Link href="/forum/new-topic">
                    <Button className="mt-4">
                      <Plus className="w-4 h-4 ml-2" />
                      ابدأ أول موضوع
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 