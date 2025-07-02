"use client";

import { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Image as ImageIcon,
  Upload,
  Search,
  Sparkles,
  FileText,
  Video,
  Music,
  CheckCircle,
  X,
  Loader2,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";

interface MediaFile {
  id: string;
  url: string;
  type: "IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO";
  title: string;
  description?: string;
  fileName: string;
  fileSize: number;
  thumbnailUrl?: string;
  relevanceScore?: number;
}

interface MediaPickerProps {
  onSelect: (media: MediaFile) => void;
  articleTitle?: string;
  articleContent?: string;
  allowedTypes?: ("IMAGE" | "VIDEO" | "DOCUMENT" | "AUDIO")[];
  multiple?: boolean;
  trigger?: React.ReactNode;
}

// مكون رفع الملفات
function UploadTab({ 
  onUploadComplete, 
  allowedTypes = ["IMAGE", "VIDEO", "DOCUMENT", "AUDIO"] 
}: { 
  onUploadComplete: (media: MediaFile[]) => void;
  allowedTypes: string[];
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFilePreview = (file: File) => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return null;
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('files', file);
    });
    
    formData.append('userId', 'current-user'); // TODO: Get from auth
    formData.append('autoAnalyze', 'true');

    try {
      const response = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        onUploadComplete(result.uploaded);
        setFiles([]);
        setUploadProgress({});
        setUploadErrors({});
      } else {
        // معالجة الأخطاء
        const errors: Record<string, string> = {};
        result.errors?.forEach((err: any) => {
          errors[err.fileName] = err.error;
        });
        setUploadErrors(errors);
      }
    } catch (error) {
      console.error('خطأ في الرفع:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* منطقة السحب والإفلات */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer"
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept={allowedTypes.includes("IMAGE") ? "image/*" : undefined}
        />
        <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium mb-2">اسحب الملفات هنا أو انقر للاختيار</p>
        <p className="text-sm text-muted-foreground">
          يمكنك رفع عدة ملفات دفعة واحدة (حتى 10MB لكل ملف)
        </p>
      </div>

      {/* قائمة الملفات المختارة */}
      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium">الملفات المختارة ({files.length})</h3>
          <ScrollArea className="h-[200px]">
            <div className="space-y-2">
              {files.map((file, index) => {
                const preview = getFilePreview(file);
                const error = uploadErrors[file.name];
                
                return (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    {/* معاينة */}
                    {preview ? (
                      <div className="relative w-16 h-16 rounded overflow-hidden flex-shrink-0">
                        <Image
                          src={preview}
                          alt={file.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-gray-400" />
                      </div>
                    )}

                    {/* معلومات الملف */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                      {error && (
                        <p className="text-sm text-red-500 flex items-center gap-1 mt-1">
                          <AlertCircle className="w-3 h-3" />
                          {error}
                        </p>
                      )}
                    </div>

                    {/* زر الحذف */}
                    {!uploading && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}

                    {/* شريط التقدم */}
                    {uploading && uploadProgress[file.name] !== undefined && (
                      <div className="w-20">
                        <div className="bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ width: `${uploadProgress[file.name]}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* أزرار الإجراءات */}
      {files.length > 0 && (
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={() => setFiles([])}
            disabled={uploading}
          >
            إلغاء الكل
          </Button>
          <Button
            onClick={uploadFiles}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري الرفع...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 ml-2" />
                رفع {files.length} ملف
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export default function MediaPicker({
  onSelect,
  articleTitle,
  articleContent,
  allowedTypes = ["IMAGE", "VIDEO", "DOCUMENT", "AUDIO"],
  multiple = false,
  trigger,
}: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<MediaFile[]>([]);
  const [suggestedMedia, setSuggestedMedia] = useState<MediaFile[]>([]);
  const [allMedia, setAllMedia] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("suggested");

  // جلب الوسائط المقترحة بناءً على المحتوى
  useEffect(() => {
    if ((open || !trigger) && (articleTitle || articleContent)) {
      fetchSuggestedMedia();
    }
  }, [open, articleTitle, articleContent, trigger]);

  // جلب جميع الوسائط
  useEffect(() => {
    if ((open || !trigger) && activeTab === "all") {
      fetchAllMedia();
    }
  }, [open, activeTab, trigger]);

  const fetchSuggestedMedia = async () => {
    if (!articleTitle && !articleContent) return;

    setLoading(true);
    try {
      const response = await fetch("/api/media/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: articleTitle,
          content: articleContent,
          limit: 20,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuggestedMedia(data.suggestions);
      }
    } catch (error) {
      console.error("Error fetching suggested media:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllMedia = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: "50",
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/media?${params}`);
      const data = await response.json();

      if (response.ok) {
        setAllMedia(data.media);
      }
    } catch (error) {
      console.error("Error fetching media:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (media: MediaFile) => {
    if (multiple) {
      const isSelected = selectedMedia.some((m) => m.id === media.id);
      if (isSelected) {
        setSelectedMedia(selectedMedia.filter((m) => m.id !== media.id));
      } else {
        setSelectedMedia([...selectedMedia, media]);
      }
    } else {
      onSelect(media);
      setOpen(false);
    }
  };

  const handleConfirmSelection = () => {
    selectedMedia.forEach((media) => onSelect(media));
    setOpen(false);
    setSelectedMedia([]);
  };

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

  const MediaGrid = ({ media }: { media: MediaFile[] }) => (
    <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
      {media.map((item) => {
        const isSelected = selectedMedia.some((m) => m.id === item.id);
        const isAllowed = allowedTypes.includes(item.type);

        return (
          <div
            key={item.id}
            className={`relative group cursor-pointer ${
              !isAllowed ? "opacity-50" : ""
            }`}
            onClick={() => isAllowed && handleSelect(item)}
          >
            <div
              className={`relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden border-2 transition-all ${
                isSelected
                  ? "border-primary ring-2 ring-primary ring-offset-2"
                  : "border-transparent hover:border-gray-300"
              }`}
            >
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

              {/* شارة النوع */}
              <Badge
                className="absolute top-2 right-2"
                variant="secondary"
              >
                {item.type}
              </Badge>

              {/* شارة التحديد */}
              {isSelected && (
                <div className="absolute top-2 left-2">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
              )}

              {/* درجة التطابق للاقتراحات */}
              {item.relevanceScore !== undefined && (
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {item.relevanceScore}%
                </div>
              )}

              {/* معلومات عند التمرير */}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                <div className="text-white text-xs">
                  <p className="font-medium truncate">{item.title}</p>
                  <p className="opacity-75">{item.fileName}</p>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const content = (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="suggested" disabled={!articleTitle}>
            <Sparkles className="w-4 h-4 ml-2" />
            مقترحة
          </TabsTrigger>
          <TabsTrigger value="all">
            <ImageIcon className="w-4 h-4 ml-2" />
            جميع الوسائط
          </TabsTrigger>
          <TabsTrigger value="upload">
            <Upload className="w-4 h-4 ml-2" />
            رفع جديد
          </TabsTrigger>
        </TabsList>

        <TabsContent value="suggested" className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">
                جاري تحليل المحتوى واقتراح الوسائط...
              </p>
            </div>
          ) : suggestedMedia.length > 0 ? (
            <ScrollArea className="h-[400px]">
              <MediaGrid media={suggestedMedia} />
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>لا توجد اقتراحات متاحة</p>
              <p className="text-sm mt-2">
                جرب إضافة عنوان أو محتوى للمقال للحصول على اقتراحات ذكية
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {/* شريط البحث */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="البحث في الوسائط..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchAllMedia()}
              className="pr-10"
            />
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <MediaGrid media={allMedia} />
            </ScrollArea>
          )}
        </TabsContent>

        <TabsContent value="upload">
          <UploadTab 
            onUploadComplete={(newMedia) => {
              setAllMedia([...newMedia, ...allMedia]);
              setActiveTab("all");
            }}
            allowedTypes={allowedTypes}
          />
        </TabsContent>
      </Tabs>

      {/* شريط الإجراءات للاختيار المتعدد */}
      {multiple && selectedMedia.length > 0 && (
        <div className="flex justify-between items-center pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            تم اختيار {selectedMedia.length} ملف
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedMedia([])}
            >
              إلغاء التحديد
            </Button>
            <Button onClick={handleConfirmSelection}>
              إضافة المحدد
            </Button>
          </div>
        </div>
      )}
    </>
  );

  // إذا لم يكن هناك trigger، اعرض المحتوى مباشرة
  if (!trigger) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold">مكتبة الوسائط</h2>
          <p className="text-muted-foreground">
            {multiple
              ? "اختر ملف أو أكثر من المكتبة"
              : "اختر ملف من المكتبة"}
          </p>
        </div>
        {content}
      </div>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <ImageIcon className="w-4 h-4 ml-2" />
            اختر من المكتبة
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>مكتبة الوسائط</DialogTitle>
          <DialogDescription>
            {multiple
              ? "اختر ملف أو أكثر من المكتبة"
              : "اختر ملف من المكتبة"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="suggested" disabled={!articleTitle}>
              <Sparkles className="w-4 h-4 ml-2" />
              مقترحة
            </TabsTrigger>
            <TabsTrigger value="all">
              <ImageIcon className="w-4 h-4 ml-2" />
              جميع الوسائط
            </TabsTrigger>
            <TabsTrigger value="upload">
              <Upload className="w-4 h-4 ml-2" />
              رفع جديد
            </TabsTrigger>
          </TabsList>

          <TabsContent value="suggested" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-muted-foreground">
                  جاري تحليل المحتوى واقتراح الوسائط...
                </p>
              </div>
            ) : suggestedMedia.length > 0 ? (
              <ScrollArea className="h-[400px]">
                <MediaGrid media={suggestedMedia} />
              </ScrollArea>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>لا توجد اقتراحات متاحة</p>
                <p className="text-sm mt-2">
                  جرب إضافة عنوان أو محتوى للمقال للحصول على اقتراحات ذكية
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {/* شريط البحث */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="البحث في الوسائط..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && fetchAllMedia()}
                className="pr-10"
              />
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <MediaGrid media={allMedia} />
              </ScrollArea>
            )}
          </TabsContent>

          <TabsContent value="upload">
            <UploadTab 
              onUploadComplete={(newMedia) => {
                setAllMedia([...newMedia, ...allMedia]);
                setActiveTab("all");
              }}
              allowedTypes={allowedTypes}
            />
          </TabsContent>
        </Tabs>

        {/* شريط الإجراءات للاختيار المتعدد */}
        {multiple && selectedMedia.length > 0 && (
          <div className="flex justify-between items-center pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              تم اختيار {selectedMedia.length} ملف
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedMedia([])}
              >
                إلغاء التحديد
              </Button>
              <Button onClick={handleConfirmSelection}>
                إضافة المحدد
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 