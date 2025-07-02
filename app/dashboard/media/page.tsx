"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RadixSelect as Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  Search,
  Filter,
  Grid,
  List,
  Image as ImageIcon,
  Video,
  FileText,
  Music,
  Download,
  Eye,
  Edit,
  Trash,
  X,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  FolderOpen,
  Tag,
  Calendar,
  BarChart,
  Sparkles,
} from "lucide-react";
import Image from "next/image";

interface MediaFile {
  id: string;
  url: string;
  type: "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO";
  title: string;
  description?: string;
  tags?: string[];
  classification?: string;
  source?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  width?: number;
  height?: number;
  duration?: number;
  thumbnailUrl?: string;
  aiEntities?: string[];
  uploadedBy: {
    id: string;
    name?: string;
    avatar?: string;
  };
  createdAt: string;
  lastUsedAt?: string;
  usageCount: number;
  categories?: Array<{
    id: string;
    name: string;
    slug: string;
    type: string;
  }>;
  usedInArticles?: Array<{
    articleId: string;
    articleTitle: string;
    articleSlug: string;
    position?: string;
  }>;
}

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedClassification, setSelectedClassification] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedMedia, setSelectedMedia] = useState<MediaFile | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  // جلب الوسائط
  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(searchQuery && { search: searchQuery }),
        ...(selectedType !== "all" && { type: selectedType }),
        ...(selectedClassification !== "all" && { classification: selectedClassification }),
      });

      const response = await fetch(`/api/media?${params}`);
      const data = await response.json();

      if (response.ok) {
        setMedia(data.media);
        setTotalPages(data.pagination.totalPages);
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل في جلب الوسائط",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery, selectedType, selectedClassification, toast]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // تحديد أيقونة نوع الملف
  const getFileIcon = (type: string) => {
    switch (type) {
      case "IMAGE":
        return <ImageIcon className="w-5 h-5" />;
      case "VIDEO":
        return <Video className="w-5 h-5" />;
      case "DOCUMENT":
        return <FileText className="w-5 h-5" />;
      case "AUDIO":
        return <Music className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  // تنسيق حجم الملف
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // عرض تفاصيل الوسائط
  const MediaDetails = ({ media }: { media: MediaFile }) => (
    <div className="space-y-4">
      {/* معاينة الوسائط */}
      <div className="relative aspect-video bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
        {media.type === "IMAGE" && (
          <Image
            src={media.url}
            alt={media.title}
            fill
            className="object-contain"
          />
        )}
        {media.type === "VIDEO" && (
          <video
            src={media.url}
            controls
            className="w-full h-full"
          />
        )}
        {(media.type === "DOCUMENT" || media.type === "AUDIO") && (
          <div className="flex items-center justify-center h-full">
            {getFileIcon(media.type)}
          </div>
        )}
      </div>

      {/* معلومات الملف */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <Label className="text-muted-foreground">اسم الملف</Label>
          <p className="font-medium">{media.fileName}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">الحجم</Label>
          <p className="font-medium">{formatFileSize(media.fileSize)}</p>
        </div>
        <div>
          <Label className="text-muted-foreground">النوع</Label>
          <p className="font-medium">{media.mimeType}</p>
        </div>
        {media.width && media.height && (
          <div>
            <Label className="text-muted-foreground">الأبعاد</Label>
            <p className="font-medium">{media.width} × {media.height}</p>
          </div>
        )}
        {media.duration && (
          <div>
            <Label className="text-muted-foreground">المدة</Label>
            <p className="font-medium">{Math.floor(media.duration / 60)}:{(media.duration % 60).toString().padStart(2, '0')}</p>
          </div>
        )}
        <div>
          <Label className="text-muted-foreground">مرات الاستخدام</Label>
          <p className="font-medium">{media.usageCount}</p>
        </div>
      </div>

      {/* الوسوم */}
      {media.tags && media.tags.length > 0 && (
        <div>
          <Label className="text-muted-foreground mb-2">الوسوم</Label>
          <div className="flex flex-wrap gap-2">
            {media.tags.map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* التصنيفات */}
      {media.categories && media.categories.length > 0 && (
        <div>
          <Label className="text-muted-foreground mb-2">التصنيفات</Label>
          <div className="flex flex-wrap gap-2">
            {media.categories.map((category) => (
              <Badge key={category.id} variant="outline">
                {category.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* المقالات المستخدمة فيها */}
      {media.usedInArticles && media.usedInArticles.length > 0 && (
        <div>
          <Label className="text-muted-foreground mb-2">مستخدمة في</Label>
          <div className="space-y-2">
            {media.usedInArticles.map((article) => (
              <a
                key={article.articleId}
                href={`/article/${article.articleSlug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <p className="font-medium text-sm">{article.articleTitle}</p>
                {article.position && (
                  <p className="text-xs text-muted-foreground">{article.position}</p>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">مكتبة الوسائط</h1>
          <p className="text-muted-foreground mt-1">
            إدارة الصور والفيديوهات والملفات
          </p>
        </div>
        <Button>
          <Upload className="w-4 h-4 ml-2" />
          رفع ملفات جديدة
        </Button>
      </div>

      {/* الفلاتر والبحث */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* البحث */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="البحث في الوسائط..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            {/* فلتر النوع */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="نوع الملف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع الأنواع</SelectItem>
                <SelectItem value="IMAGE">صور</SelectItem>
                <SelectItem value="VIDEO">فيديو</SelectItem>
                <SelectItem value="DOCUMENT">مستندات</SelectItem>
                <SelectItem value="AUDIO">صوت</SelectItem>
              </SelectContent>
            </Select>

            {/* فلتر التصنيف */}
            <Select value={selectedClassification} onValueChange={setSelectedClassification}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="التصنيف" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">جميع التصنيفات</SelectItem>
                <SelectItem value="king-salman">الملك سلمان</SelectItem>
                <SelectItem value="crown-prince-mbs">ولي العهد</SelectItem>
                <SelectItem value="ministers">وزراء</SelectItem>
                <SelectItem value="events">مناسبات</SelectItem>
                <SelectItem value="places">أماكن</SelectItem>
              </SelectContent>
            </Select>

            {/* تبديل العرض */}
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* عرض الوسائط */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">جاري تحميل الوسائط...</p>
        </div>
      ) : media.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">لا توجد وسائط</p>
          </CardContent>
        </Card>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {media.map((item) => (
            <Dialog key={item.id}>
              <DialogTrigger asChild>
                <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                  <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
                    {item.type === "IMAGE" && item.thumbnailUrl ? (
                      <Image
                        src={item.thumbnailUrl || item.url}
                        alt={item.title}
                        fill
                        className="object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        {getFileIcon(item.type)}
                      </div>
                    )}
                    <Badge className="absolute top-2 right-2" variant="secondary">
                      {item.type}
                    </Badge>
                  </div>
                  <CardContent className="p-3">
                    <p className="font-medium text-sm truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(item.fileSize)}
                    </p>
                    {item.usageCount > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span className="text-xs">مستخدم {item.usageCount} مرة</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{item.title}</DialogTitle>
                  <DialogDescription>
                    {item.description || "لا يوجد وصف"}
                  </DialogDescription>
                </DialogHeader>
                <MediaDetails media={item} />
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline">
                    <Download className="w-4 h-4 ml-2" />
                    تحميل
                  </Button>
                  <Button variant="outline">
                    <Edit className="w-4 h-4 ml-2" />
                    تعديل
                  </Button>
                  <Button variant="destructive">
                    <Trash className="w-4 h-4 ml-2" />
                    حذف
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {media.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* معاينة */}
                  <div className="relative w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                    {item.type === "IMAGE" && item.thumbnailUrl ? (
                      <Image
                        src={item.thumbnailUrl || item.url}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        {getFileIcon(item.type)}
                      </div>
                    )}
                  </div>

                  {/* معلومات */}
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {item.fileName} • {formatFileSize(item.fileSize)}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.createdAt).toLocaleDateString("ar-SA")}
                      </span>
                      {item.usageCount > 0 && (
                        <span className="flex items-center gap-1">
                          <BarChart className="w-3 h-3" />
                          {item.usageCount} استخدام
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {item.uploadedBy.name || "مجهول"}
                      </span>
                    </div>
                  </div>

                  {/* أزرار الإجراءات */}
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{item.title}</DialogTitle>
                          <DialogDescription>
                            {item.description || "لا يوجد وصف"}
                          </DialogDescription>
                        </DialogHeader>
                        <MediaDetails media={item} />
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="icon">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* التنقل بين الصفحات */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
          >
            السابق
          </Button>
          <span className="flex items-center px-4">
            صفحة {page} من {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
          >
            التالي
          </Button>
        </div>
      )}
    </div>
  );
}
