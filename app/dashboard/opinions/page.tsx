'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit, Trash2, Eye, Calendar, User, MessageSquare, TrendingUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { format } from 'date-fns'
import { ar } from 'date-fns/locale'
import { useToast } from '@/hooks/use-toast'
import { useDarkModeContext } from '@/contexts/DarkModeContext'

interface OpinionAuthor {
  id: string
  name: string
  avatar?: string
}

interface Article {
  id: string
  title: string
  slug: string
  excerpt?: string
  status: string
  type: string
  views: number
  created_at: string
  published_at?: string
  allow_comments: boolean
  opinion_author?: OpinionAuthor
  _count?: {
    comments: number
  }
}

export default function OpinionsPage() {
  const { darkMode } = useDarkModeContext()
  const { toast } = useToast()
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchArticles()
  }, [])

  const fetchArticles = async () => {
    try {
      const response = await fetch('/api/articles?type=OPINION&limit=100')
      if (response.ok) {
        const data = await response.json()
        setArticles(data.articles || [])
      } else {
        toast({
          title: 'خطأ في جلب المقالات',
          description: 'حدث خطأ أثناء جلب مقالات الرأي',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error fetching articles:', error)
      toast({
        title: 'خطأ في الاتصال',
        description: 'تعذر الاتصال بالخادم',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المقال؟')) return

    setDeleting(id)
    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'تم الحذف بنجاح',
          description: 'تم حذف مقال الرأي بنجاح'
        })
        fetchArticles()
      } else {
        toast({
          title: 'خطأ في الحذف',
          description: 'حدث خطأ أثناء حذف المقال',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error deleting article:', error)
      toast({
        title: 'خطأ في الاتصال',
        description: 'تعذر الاتصال بالخادم',
        variant: 'destructive'
      })
    } finally {
      setDeleting(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      published: 'default',
      draft: 'secondary',
      scheduled: 'outline'
    }

    const labels: Record<string, string> = {
      published: 'منشور',
      draft: 'مسودة',
      scheduled: 'مجدول'
    }

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* الهيدر */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">مقالات الرأي</h1>
          <p className="text-gray-500 mt-2">إدارة وعرض جميع مقالات الرأي</p>
        </div>
        <Link href="/dashboard/opinions/create">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            مقال رأي جديد
          </Button>
        </Link>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">إجمالي المقالات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{articles.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">المنشورة</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {articles.filter(a => a.status === 'published').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">المسودات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {articles.filter(a => a.status === 'draft').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">إجمالي المشاهدات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {articles.reduce((sum, a) => sum + (a.views || 0), 0).toLocaleString('ar-SA')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* قائمة المقالات */}
      <Card>
        <CardHeader>
          <CardTitle>جميع مقالات الرأي</CardTitle>
        </CardHeader>
        <CardContent>
          {articles.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">لا توجد مقالات رأي حتى الآن</p>
              <Link href="/dashboard/opinions/create">
                <Button variant="outline">
                  <Plus className="w-4 h-4 ml-2" />
                  إنشاء أول مقال
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.map((article) => (
                <div
                  key={article.id}
                  className={`p-4 rounded-lg border transition-all ${
                    darkMode 
                      ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        {article.opinion_author?.avatar && (
                          <img
                            src={article.opinion_author.avatar}
                            alt={article.opinion_author.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">
                            {article.title}
                          </h3>
                          {article.excerpt && (
                            <p className="text-gray-600 dark:text-gray-400 text-sm mb-2 line-clamp-2">
                              {article.excerpt}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            {article.opinion_author && (
                              <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {article.opinion_author.name}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(article.created_at), 'dd MMM yyyy', { locale: ar })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-4 h-4" />
                              {(article.views || 0).toLocaleString('ar-SA')}
                            </span>
                            {article._count && (
                              <span className="flex items-center gap-1">
                                <MessageSquare className="w-4 h-4" />
                                {article._count.comments}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(article.status)}
                      <Link href={`/article/${article.id}`} target="_blank">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Link href={`/dashboard/news/edit/${article.id}`}>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(article.id)}
                        disabled={deleting === article.id}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 