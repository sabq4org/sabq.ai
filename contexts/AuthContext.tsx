'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import Cookies from 'js-cookie';
import { jwtDecode, JwtPayload } from 'jwt-decode';

export interface User extends JwtPayload {
  id: string;
  name: string;
  email: string;
  role: string;
  is_admin?: boolean;
  loyaltyPoints?: number;
  status?: string;
  isVerified?: boolean;
}

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hook لاستخدام AuthContext
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserFromAPI = async (): Promise<User | null> => {
    try {
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          return data.user;
        }
      }
      return null;
    } catch (error) {
      console.error('خطأ في جلب بيانات المستخدم من API:', error);
      return null;
    }
  };

  const loadUserFromCookie = async () => {
    try {
      // محاولة جلب بيانات المستخدم من API أولاً
      const userData = await fetchUserFromAPI();
      if (userData) {
        setUser(userData);
        // مزامنة مع localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(userData));
          if (userData.id) {
            localStorage.setItem('user_id', String(userData.id));
          }
        }
        setLoading(false);
        return;
      }

      // إذا فشل API، محاولة قراءة من الكوكيز كـ fallback
      const userCookie = Cookies.get('user');
      if (userCookie) {
        try {
          const userData = JSON.parse(decodeURIComponent(userCookie));
          setUser(userData);
          if (typeof window !== 'undefined') {
            localStorage.setItem('user', JSON.stringify(userData));
            if (userData.id) {
              localStorage.setItem('user_id', String(userData.id));
            }
          }
          setLoading(false);
          return;
        } catch (error) {
          console.error("فشل في قراءة كوكيز المستخدم:", error);
        }
      }

      // إذا لم نجد أي بيانات مستخدم، تنظيف localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('user_id');
      }

      // إذا لم نجد أي بيانات مستخدم
      setUser(null);
    } catch (error) {
      console.error("خطأ في تحميل بيانات المستخدم:", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadUserFromCookie();
  }, []);

  const login = (token: string) => {
    try {
      const decodedUser = jwtDecode<User>(token);
      setUser(decodedUser);
      Cookies.set('token', token, { expires: 7, secure: true, sameSite: 'lax' });
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(decodedUser));
        if (decodedUser.id) {
          localStorage.setItem('user_id', String(decodedUser.id));
        }
      }
    } catch (error) {
      console.error("فشل في معالجة التوكن عند تسجيل الدخول:", error);
    }
  };

  const logout = async () => {
    try {
      // استدعاء API تسجيل الخروج
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }

    setUser(null);
    // إزالة جميع الكوكيز المتعلقة بالمصادقة
    Cookies.remove('user');
    Cookies.remove('auth-token');
    Cookies.remove('token');
    
    // إزالة من localStorage أيضاً
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      localStorage.removeItem('user_id');
      localStorage.removeItem('user_preferences');
      localStorage.removeItem('darkMode');
      sessionStorage.removeItem('user');
      sessionStorage.clear(); // تنظيف جميع بيانات الجلسة
    }
    
    window.location.href = '/'; // العودة للصفحة الرئيسية بدلاً من صفحة تسجيل الدخول
  };

  const refreshUser = async () => {
    const userData = await fetchUserFromAPI();
    if (userData) {
      setUser(userData);
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(userData));
        if (userData.id) {
          localStorage.setItem('user_id', String(userData.id));
        }
      }
    } else {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 