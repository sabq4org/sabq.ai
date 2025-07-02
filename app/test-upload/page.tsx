'use client';

import { useState } from 'react';
import { Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast, Toaster } from 'react-hot-toast';

export default function ImageUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
      setUploadedUrl(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('الرجاء اختيار ملف أولاً');
      return;
    }

    setLoading(true);
    setUploadedUrl(null);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok && result.success) {
        toast.success(result.message);
        setUploadedUrl(result.url);
      } else {
        throw new Error(result.error || 'فشل رفع الملف');
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
        <div className="w-full max-w-lg">
          <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
            <h1 className="text-2xl font-bold text-center text-gray-800">
              رفع الصور
            </h1>
            
            <div className="text-center">
              <label 
                htmlFor="file-upload" 
                className="cursor-pointer inline-block"
              >
                <div className="w-48 h-48 mx-auto border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-500 hover:bg-gray-50 transition-colors">
                  {preview ? (
                    <img src={preview} alt="معاينة" className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <div className="text-center text-gray-400">
                      <ImageIcon className="w-12 h-12 mx-auto" />
                      <p className="mt-2 text-sm">اسحب وأفلت أو انقر للاختيار</p>
                    </div>
                  )}
                </div>
              </label>
              <Input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept="image/*"
              />
            </div>
            
            {file && (
              <div className="text-center text-sm text-gray-600">
                <p>الملف المختار: {file.name}</p>
                <p>الحجم: {(file.size / 1024).toFixed(2)} كيلوبايت</p>
              </div>
            )}
            
            <Button
              onClick={handleUpload}
              disabled={!file || loading}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الرفع...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 ml-2" />
                  رفع الصورة
                </>
              )}
            </Button>
            
            {uploadedUrl && (
              <div className="mt-6 p-4 bg-green-50 text-green-800 border border-green-200 rounded-lg">
                <p className="font-semibold">تم الرفع بنجاح!</p>
                <a 
                  href={uploadedUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm break-all hover:underline"
                >
                  {window.location.origin}{uploadedUrl}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
} 