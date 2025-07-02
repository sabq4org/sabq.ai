'use client';

import React, { useState } from 'react';
import { Mail, Send, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function TestEmailPage() {
  const [email, setEmail] = useState('');
  const [testType, setTestType] = useState<'connection' | 'verification' | 'welcome'>('connection');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTest = async () => {
    setLoading(true);
    setResult(null);

    try {
      let response;
      
      switch (testType) {
        case 'connection':
          response = await fetch('/api/test-email-connection', {
            method: 'POST'
          });
          break;
          
        case 'verification':
          if (!email) {
            toast.error('يرجى إدخال البريد الإلكتروني');
            setLoading(false);
            return;
          }
          response = await fetch('/api/test-email-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          break;
          
        case 'welcome':
          if (!email) {
            toast.error('يرجى إدخال البريد الإلكتروني');
            setLoading(false);
            return;
          }
          response = await fetch('/api/test-email-welcome', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          break;
      }

      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        toast.success(data.message || 'تم الاختبار بنجاح');
      } else {
        toast.error(data.error || 'فشل الاختبار');
      }
    } catch (error) {
      toast.error('حدث خطأ في الاتصال');
      setResult({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4">
              <Mail className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              اختبار إعدادات البريد الإلكتروني
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              تحقق من أن إعدادات SMTP تعمل بشكل صحيح
            </p>
          </div>

          <div className="space-y-6">
            {/* نوع الاختبار */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                نوع الاختبار
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setTestType('connection')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    testType === 'connection'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="font-medium">اختبار الاتصال</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    التحقق من SMTP
                  </div>
                </button>
                
                <button
                  onClick={() => setTestType('verification')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    testType === 'verification'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="font-medium">بريد التحقق</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    إرسال رمز تحقق
                  </div>
                </button>
                
                <button
                  onClick={() => setTestType('welcome')}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    testType === 'welcome'
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                  }`}
                >
                  <div className="font-medium">بريد الترحيب</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    رسالة ترحيبية
                  </div>
                </button>
              </div>
            </div>

            {/* حقل البريد الإلكتروني */}
            {(testType === 'verification' || testType === 'welcome') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  البريد الإلكتروني للاختبار
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="test@example.com"
                  dir="ltr"
                />
              </div>
            )}

            {/* زر الاختبار */}
            <button
              onClick={handleTest}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  جاري الاختبار...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  بدء الاختبار
                </>
              )}
            </button>

            {/* نتائج الاختبار */}
            {result && (
              <div className={`p-4 rounded-lg border ${
                result.success 
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-start gap-3">
                  {result.success ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${
                      result.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                    }`}>
                      {result.success ? 'نجح الاختبار' : 'فشل الاختبار'}
                    </p>
                    <p className={`text-sm mt-1 ${
                      result.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                    }`}>
                      {result.message || result.error}
                    </p>
                    {result.details && (
                      <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto">
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* معلومات SMTP الحالية */}
          <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">إعدادات SMTP الحالية:</h3>
            <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <p>الخادم: mail.jur3a.ai</p>
              <p>المنفذ: 465 (SSL)</p>
              <p>المستخدم: noreplay@jur3a.ai</p>
              <p>المرسل: صحيفة سبق الإلكترونية</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 