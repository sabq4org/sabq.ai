'use client';

import React, { useState } from 'react';
import { Upload, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TestImageSection() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [featuredImage, setFeaturedImage] = useState<string | null>('/uploads/test-new-image.jpg');

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('حجم الملف يجب أن يكون أقل من 5 ميجابايت');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('الرجاء اختيار ملف صورة صالح');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-8">اختبار قسم رفع الصورة</h1>
      
      <div className="max-w-2xl">
        <label className="block text-sm font-medium mb-2">
          الصورة المميزة
        </label>
        <div className="space-y-4">
          {(imagePreview || featuredImage) ? (
            <div className="relative">
              <img
                src={imagePreview || featuredImage || ''}
                alt="معاينة الصورة"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                  setFeaturedImage(null);
                }}
                className="absolute top-2 left-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-300 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500">
              <input
                type="file"
                id="featuredImage"
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
              />
              <label
                htmlFor="featuredImage"
                className="cursor-pointer flex flex-col items-center gap-3"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 dark:bg-gray-700">
                  <Upload className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-300">
                    اضغط لرفع صورة
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    PNG, JPG, GIF حتى 5 ميجابايت
                  </p>
                </div>
              </label>
            </div>
          )}
        </div>
        
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <h3 className="font-bold mb-2">معلومات التشخيص:</h3>
          <ul className="space-y-1 text-sm">
            <li>imageFile: {imageFile ? 'موجود' : 'غير موجود'}</li>
            <li>imagePreview: {imagePreview ? 'موجود' : 'غير موجود'}</li>
            <li>featuredImage: {featuredImage || 'غير موجود'}</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 