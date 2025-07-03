'use client';

import React, { useState } from 'react';
import { Brain, Send, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

export default function TestCommentAI() {
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [useOpenAI, setUseOpenAI] = useState(false);

  const testComment = async () => {
    if (!comment.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/test-comment-classification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment, useOpenAI })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error testing comment:', error);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    if (score >= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'safe': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'questionable': return <Info className="w-5 h-5 text-yellow-600" />;
      case 'suspicious': return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case 'toxic': return <XCircle className="w-5 h-5 text-red-600" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex items-center gap-3 mb-8">
            <Brain className="w-8 h-8 text-purple-600" />
            <h1 className="text-3xl font-bold">اختبار نظام تصنيف التعليقات الذكي</h1>
          </div>

          <div className="space-y-6">
            {/* خيار نوع التحليل */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useOpenAI}
                  onChange={(e) => setUseOpenAI(e.target.checked)}
                  className="w-4 h-4 text-purple-600"
                />
                <span>استخدام OpenAI GPT-4 (يتطلب مفتاح API)</span>
              </label>
            </div>

            {/* حقل إدخال التعليق */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اكتب التعليق المراد تحليله:
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                rows={4}
                placeholder="اكتب تعليقاً هنا لاختبار النظام..."
              />
            </div>

            {/* زر التحليل */}
            <button
              onClick={testComment}
              disabled={loading || !comment.trim()}
              className="w-full py-3 px-6 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  جارٍ التحليل...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  تحليل التعليق
                </>
              )}
            </button>

            {/* النتائج */}
            {result && result.analysis && (
              <div className="mt-8 space-y-6">
                <h2 className="text-xl font-bold">نتائج التحليل:</h2>
                
                {/* النتيجة الرئيسية */}
                <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getClassificationIcon(result.analysis.classification)}
                      <span className="font-medium">التصنيف: {result.analysis.classification}</span>
                    </div>
                    <div className={`text-3xl font-bold ${getScoreColor(result.analysis.score)}`}>
                      {result.analysis.score}%
                    </div>
                  </div>
                  
                  {result.analysis.reason && (
                    <p className="text-gray-600">السبب: {result.analysis.reason}</p>
                  )}
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span>الإجراء المقترح:</span>
                      <span className={`font-medium px-3 py-1 rounded-full text-sm ${
                        result.analysis.recommendation.color === 'green' ? 'bg-green-100 text-green-800' :
                        result.analysis.recommendation.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
                        result.analysis.recommendation.color === 'orange' ? 'bg-orange-100 text-orange-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {result.analysis.recommendation.message}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500 space-y-1">
                    <p>مزود التحليل: {result.analysis.aiProvider === 'openai' ? 'OpenAI GPT-4' : 'التحليل المحلي'}</p>
                    <p>مستوى الثقة: {(result.analysis.confidence * 100).toFixed(0)}%</p>
                    {result.analysis.processingTime > 0 && (
                      <p>وقت المعالجة: {result.analysis.processingTime}ms</p>
                    )}
                  </div>
                </div>

                {/* أمثلة للاختبار */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">أمثلة للاختبار السريع:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(result.testExamples).map(([type, examples]: [string, any]) => (
                      <div key={type} className="bg-gray-50 rounded-lg p-4">
                        <h4 className={`font-medium mb-2 ${
                          type === 'safe' ? 'text-green-600' :
                          type === 'questionable' ? 'text-yellow-600' :
                          type === 'suspicious' ? 'text-orange-600' :
                          'text-red-600'
                        }`}>
                          {type === 'safe' ? 'آمن' :
                           type === 'questionable' ? 'مشكوك فيه' :
                           type === 'suspicious' ? 'مشبوه' :
                           'مرفوض'}
                        </h4>
                        <ul className="space-y-1">
                          {examples.map((example: string, index: number) => (
                            <li key={index}>
                              <button
                                onClick={() => setComment(example)}
                                className="text-sm text-gray-600 hover:text-purple-600 hover:underline text-right"
                              >
                                "{example}"
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 