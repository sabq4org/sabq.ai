import { useState, useEffect, createContext, useContext } from 'react';
import { trackEvent } from '../lib/analytics';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  createdAt: string;
  lastLoginAt?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // جلب معلومات المستخدم الحالي
  const refreshUser = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        
        // حفظ معلومات المستخدم في localStorage للتتبع
        localStorage.setItem('sabq_user', JSON.stringify(data.user));
      } else {
        setUser(null);
        localStorage.removeItem('sabq_user');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
      localStorage.removeItem('sabq_user');
    } finally {
      setLoading(false);
    }
  };

  // تسجيل الدخول
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        localStorage.setItem('sabq_user', JSON.stringify(data.user));
        
        // تتبع نجاح تسجيل الدخول
        await trackEvent('login_success', {
          userId: data.user.id,
          method: 'email',
        });

        return { success: true };
      } else {
        // تتبع فشل تسجيل الدخول
        await trackEvent('login_failure', {
          email,
          error: data.error,
        });

        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      
      await trackEvent('login_error', {
        email,
        error: 'network_error',
      });

      return { success: false, error: 'حدث خطأ في الاتصال' };
    } finally {
      setLoading(false);
    }
  };

  // تسجيل الخروج
  const logout = async () => {
    try {
      const userId = user?.id;
      
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      setUser(null);
      localStorage.removeItem('sabq_user');
      
      // تتبع تسجيل الخروج
      await trackEvent('logout_success', { userId });
      
    } catch (error) {
      console.error('Logout error:', error);
      
      // حتى لو فشل في الخادم، امسح البيانات محلياً
      setUser(null);
      localStorage.removeItem('sabq_user');
      
      await trackEvent('logout_error', {
        userId: user?.id,
        error: 'network_error',
      });
    }
  };

  // التسجيل
  const register = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        localStorage.setItem('sabq_user', JSON.stringify(data.user));
        
        // تتبع نجاح التسجيل
        await trackEvent('register_success', {
          userId: data.user.id,
          name,
          email,
        });

        return { success: true };
      } else {
        // تتبع فشل التسجيل
        await trackEvent('register_failure', {
          name,
          email,
          error: data.error,
        });

        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Register error:', error);
      
      await trackEvent('register_error', {
        name,
        email,
        error: 'network_error',
      });

      return { success: false, error: 'حدث خطأ في الاتصال' };
    } finally {
      setLoading(false);
    }
  };

  // تحميل المستخدم عند بداية التطبيق
  useEffect(() => {
    refreshUser();
  }, []);

  return {
    user,
    loading,
    login,
    logout,
    register,
    refreshUser,
  };
}

export { AuthContext }; 