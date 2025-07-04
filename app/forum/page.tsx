"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, MessageSquare, ThumbsUp, Eye, Search, Plus, TrendingUp, Award, MessageCircle } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState("topics");
  const [selectedCategory, setSelectedCategory] = useState("");

  // جلب المواضيع من API
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (selectedCategory) params.append('category', selectedCategory);
        
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

    if (activeTab === "topics") {
      fetchTopics();
    }
  }, [activeTab, selectedCategory]);

  // بيانات تجريبية للمستخدمين والأوسمة (حتى يتم تنفيذ APIs الخاصة بها)
  const mockUsers = [
    {
      id: 1,
      name: "أحمد الغامدي",
      avatar: "/images/authors/author-1.jpg",
      badge: "محرر متميز",
      points: 2450,
      posts: 158,
      replies: 263,
      joined: "2023-01-15"
    },
    {
      id: 2,
      name: "سارة المالكي",
      avatar: "/images/authors/author-2.jpg",
      badge: "عضو نشط",
      points: 1850,
      posts: 94,
      replies: 468,
      joined: "2023-03-20"
    },
    {
      id: 3,
      name: "فاطمة الحربي",
      avatar: "/images/authors/author-3.jpg",
      badge: "مساهم",
      points: 950,
      posts: 23,
      replies: 102,
      joined: "2024-01-10"
    }
  ];

  const mockBadges = [
    {
      id: 1,
      name: "عضو مؤسس",
      icon: "🏆",
      description: "انضم للمنتدى في أول 100 عضو",
      color: "bg-yellow-500",
      count: 89
    },
    {
      id: 2,
      name: "محرر متميز",
      icon: "✍️",
      description: "كتب أكثر من 100 موضوع مفيد",
      color: "bg-blue-500",
      count: 23
    },
    {
      id: 3,
      name: "خبير حلول",
      icon: "💡",
      description: "قدم 50 حل لمشاكل الأعضاء",
      color: "bg-green-500",
      count: 15
    },
    {
      id: 4,
      name: "مشارك نشط",
      icon: "🔥",
      description: "نشط لمدة 30 يوم متتالية",
      color: "bg-orange-500",
      count: 156
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <MessageCircle className="w-8 h-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">منتدى سبق</h1>
              </Link>
              <Badge variant="secondary" className="hidden sm:inline-flex">
                <TrendingUp className="w-3 h-3 mr-1" />
                1,234 عضو نشط
              </Badge>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="ابحث في المنتدى..." 
                  className="pr-10 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <Button variant="outline" size="icon">
                <Bell className="w-4 h-4" />
              </Button>
              
              <Link href="/forum/new-topic">
                <Button className="hidden sm:flex">
                  <Plus className="w-4 h-4 mr-2" />
                  موضوع جديد
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="topics" className="space-y-6" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="topics">المواضيع</TabsTrigger>
            <TabsTrigger value="users">الأعضاء</TabsTrigger>
            <TabsTrigger value="badges">الأوسمة</TabsTrigger>
            <TabsTrigger value="requests">الاقتراحات</TabsTrigger>
          </TabsList>

          {/* Topics Tab */}
          <TabsContent value="topics" className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">أحدث المواضيع</h2>
              <div className="flex gap-2">
                <Button 
                  variant={selectedCategory === '' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setSelectedCategory('')}
                >
                  الكل
                </Button>
                <Button 
                  variant={selectedCategory === 'general' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setSelectedCategory('general')}
                >
                  نقاش عام
                </Button>
                <Button 
                  variant={selectedCategory === 'help' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setSelectedCategory('help')}
                >
                  مساعدة
                </Button>
                <Button 
                  variant={selectedCategory === 'requests' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setSelectedCategory('requests')}
                >
                  اقتراحات
                </Button>
              </div>
            </div>
            
            <div className="space-y-3">
              {loading ? (
                // Loading skeleton
                [1, 2, 3].map(i => (
                  <Card key={i} className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                      <div className="flex-1">
                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : topics.length > 0 ? (
                topics.map((topic) => (
                  <Card key={topic.id} className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <Avatar>
                          <AvatarFallback>{topic.author.name[0]}</AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                {topic.is_pinned && <Badge variant="default" className="text-xs">مثبت</Badge>}
                                <Badge className={`${topic.category.color} text-white text-xs`}>
                                  {topic.category.name}
                                </Badge>
                              </div>
                              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                                {topic.title}
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>{topic.author.name}</span>
                                <span>•</span>
                                <span>{topic.lastReply}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500 flex-shrink-0">
                              <div className="flex items-center gap-1">
                                <span className="number-display">{topic.replies}</span>
                                <MessageSquare className="w-4 h-4" />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="number-display">{topic.views}</span>
                                <Eye className="w-4 h-4" />
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="number-display">{topic.likes}</span>
                                <ThumbsUp className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">لا توجد مواضيع حتى الآن</p>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>أكثر الأعضاء نشاطاً</CardTitle>
                <CardDescription>الأعضاء الأكثر مساهمة في المنتدى</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockUsers.map((user, index) => (
                    <div key={user.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="text-2xl font-bold text-gray-400 w-8">
                        {index + 1}
                      </div>
                      
                      <Avatar className="w-12 h-12">
                        <AvatarFallback>{user.name[0]}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{user.name}</h4>
                          <Badge variant="secondary" className="text-xs">{user.badge}</Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          انضم في {new Date(user.joined).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-yellow-600 justify-end">
                          <span className="font-semibold number-display">{user.points}</span>
                          <Award className="w-4 h-4" />
                        </div>
                        <p className="text-xs text-gray-500">
                          <span className="number-display">{user.posts}</span> موضوع • <span className="number-display">{user.replies}</span> رد
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Badges Tab */}
          <TabsContent value="badges" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>أوسمة المنتدى</CardTitle>
                <CardDescription>احصل على أوسمة مقابل مساهماتك ونشاطك</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mockBadges.map((badge) => (
                    <div key={badge.id} className="flex items-center gap-4 p-4 rounded-lg border">
                      <div className={`w-12 h-12 ${badge.color} rounded-full flex items-center justify-center text-white text-2xl flex-shrink-0`}>
                        {badge.icon}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{badge.name}</h4>
                        <p className="text-sm text-gray-500">{badge.description}</p>
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-semibold number-display">{badge.count}</p>
                        <p className="text-xs text-gray-500">عضو</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-purple-600">💡</span>
                    طلبات المميزات
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                    <h4 className="font-medium mb-1">دعم الكتابة بالذكاء الاصطناعي</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Badge variant="secondary">قيد المراجعة</Badge>
                      <span>88 صوت</span>
                      <span>•</span>
                      <span>23 تعليق</span>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                    <h4 className="font-medium mb-1">تطبيق جوال للمنتدى</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Badge className="bg-green-500 text-white">مخطط له</Badge>
                      <span>156 صوت</span>
                      <span>•</span>
                      <span>45 تعليق</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-red-600">🐛</span>
                    تقارير الأخطاء
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                    <h4 className="font-medium mb-1">مشكلة في رفع الملفات الكبيرة</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Badge variant="destructive">عاجل</Badge>
                      <span>قبل 3 ساعات</span>
                    </div>
                  </div>
                  
                  <div className="p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer">
                    <h4 className="font-medium mb-1">تأخر في تحميل الصفحات</h4>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Badge className="bg-yellow-500 text-white">قيد الإصلاح</Badge>
                      <span>قبل يومين</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 