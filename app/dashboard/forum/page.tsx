"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Users, 
  Flag, 
  TrendingUp, 
  Eye, 
  ThumbsUp,
  Calendar,
  Search,
  MoreVertical,
  CheckCircle,
  XCircle,
  AlertCircle
} from "lucide-react";
import { useState } from "react";

// بيانات تجريبية للإحصائيات
const stats = [
  {
    title: "إجمالي المواضيع",
    value: "1,234",
    change: "+12%",
    icon: MessageCircle,
    color: "text-blue-600",
    bgColor: "bg-blue-100"
  },
  {
    title: "الأعضاء النشطون",
    value: "456",
    change: "+8%",
    icon: Users,
    color: "text-green-600",
    bgColor: "bg-green-100"
  },
  {
    title: "التقارير المعلقة",
    value: "23",
    change: "-5%",
    icon: Flag,
    color: "text-red-600",
    bgColor: "bg-red-100"
  },
  {
    title: "معدل التفاعل",
    value: "78%",
    change: "+3%",
    icon: TrendingUp,
    color: "text-purple-600",
    bgColor: "bg-purple-100"
  }
];

// بيانات المواضيع المبلغ عنها
const reportedContent = [
  {
    id: 1,
    type: "topic",
    title: "موضوع يحتوي على محتوى غير لائق",
    author: "user123",
    reporter: "أحمد سالم",
    reason: "محتوى غير لائق",
    reportedAt: "قبل ساعتين",
    status: "pending"
  },
  {
    id: 2,
    type: "reply",
    title: "رد يحتوي على إساءة شخصية",
    author: "user456",
    reporter: "فاطمة علي",
    reason: "إساءة وتحرش",
    reportedAt: "قبل 5 ساعات",
    status: "pending"
  }
];

// أحدث المواضيع
const recentTopics = [
  {
    id: 1,
    title: "كيف أستخدم نظام الذكاء الاصطناعي في سبق؟",
    author: "أحمد الغامدي",
    category: "مساعدة",
    replies: 12,
    views: 458,
    createdAt: "قبل 30 دقيقة"
  },
  {
    id: 2,
    title: "اقتراح: إضافة ميزة الترجمة التلقائية",
    author: "سارة المالكي",
    category: "اقتراحات",
    replies: 45,
    views: 1234,
    createdAt: "قبل ساعة"
  }
];

export default function ForumDashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">إدارة المنتدى</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            إدارة فئات ومواضيع منتدى سبق
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="بحث في المنتدى..." 
              className="pr-10 w-64"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button>
            <MessageCircle className="w-4 h-4 ml-2" />
            موضوع جديد
          </Button>
        </div>
      </div>

      {/* إحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{stat.title}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    <p className={`text-sm mt-1 ${
                      stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {stat.change} من الشهر الماضي
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* التبويبات الرئيسية */}
      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reports">التقارير المعلقة</TabsTrigger>
          <TabsTrigger value="topics">المواضيع الحديثة</TabsTrigger>
          <TabsTrigger value="users">إدارة المستخدمين</TabsTrigger>
          <TabsTrigger value="settings">الإعدادات</TabsTrigger>
        </TabsList>

        {/* تبويب التقارير */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flag className="w-5 h-5 text-red-600" />
                التقارير المعلقة ({reportedContent.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportedContent.map((report) => (
                  <div key={report.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={report.type === 'topic' ? 'default' : 'secondary'}>
                            {report.type === 'topic' ? 'موضوع' : 'رد'}
                          </Badge>
                          <span className="text-sm text-gray-500">{report.reportedAt}</span>
                        </div>
                        <h4 className="font-semibold mb-1">{report.title}</h4>
                        <div className="text-sm text-gray-600">
                          <p>الكاتب: <span className="font-medium">{report.author}</span></p>
                          <p>المبلغ: <span className="font-medium">{report.reporter}</span></p>
                          <p>السبب: <Badge variant="destructive" className="text-xs">{report.reason}</Badge></p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700">
                          <CheckCircle className="w-4 h-4 ml-1" />
                          قبول
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                          <XCircle className="w-4 h-4 ml-1" />
                          رفض
                        </Button>
                        <Button size="sm" variant="ghost">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب المواضيع */}
        <TabsContent value="topics">
          <Card>
            <CardHeader>
              <CardTitle>أحدث المواضيع</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentTopics.map((topic) => (
                  <div key={topic.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div>
                      <h4 className="font-semibold">{topic.title}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span>{topic.author}</span>
                        <Badge variant="secondary">{topic.category}</Badge>
                        <span>{topic.createdAt}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <MessageCircle className="w-4 h-4" />
                        {topic.replies}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        {topic.views}
                      </div>
                      <Button size="sm" variant="ghost">
                        إدارة
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب المستخدمين */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>إدارة المستخدمين</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">قسم إدارة المستخدمين والصلاحيات...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* تبويب الإعدادات */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>إعدادات المنتدى</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">إعدادات وتكوينات المنتدى...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 