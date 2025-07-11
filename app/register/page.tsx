"use client";
import { useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // التحقق من تطابق كلمات المرور
    if (password !== confirmPassword) {
      setError("كلمات المرور غير متطابقة");
      return;
    }

    // التحقق من طول كلمة المرور
    if (password.length < 6) {
      setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
        window.location.href = "/login";
      } else {
        const data = await res.json();
        setError(data.error || "فشل إنشاء الحساب");
      }
    } catch (err) {
      setError("حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100" dir="rtl">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">إنشاء حساب جديد</h1>
          <p className="text-gray-600">انضم إلى سبق الذكية</p>
        </div>
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              الاسم الكامل
            </label>
            <input
              id="name"
              type="text"
              placeholder="أحمد محمد"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              البريد الإلكتروني
            </label>
            <input
              id="email"
              type="email"
              placeholder="example@domain.com"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              كلمة المرور
            </label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              تأكيد كلمة المرور
            </label>
            <input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={6}
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white p-3 rounded-md font-medium transition-colors duration-200"
            disabled={isLoading}
          >
            {isLoading ? "جاري إنشاء الحساب..." : "إنشاء حساب"}
          </button>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm text-center">
              {error}
            </div>
          )}
        </form>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            لديك حساب بالفعل؟{" "}
            <a href="/login" className="text-indigo-600 hover:text-indigo-800 font-medium">
              تسجيل الدخول
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 