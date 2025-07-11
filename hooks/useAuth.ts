import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: {
    name: string;
    permissions: string[];
  };
  emailVerified: boolean;
  phoneVerified: boolean;
  preferences: {
    language: string;
    theme: string;
    notifications: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
  stats: {
    articlesRead: number;
    totalReadingTime: number;
    commentsCount: number;
    sharesCount: number;
  };
  security: {
    twoFactorEnabled: boolean;
    lastPasswordChangeAt?: string;
  };
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
  newsletter?: boolean;
  referralCode?: string;
}

export const useAuth = () => {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    error: null,
  });

  // Check authentication status
  const checkAuth = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setState({
          user: data.user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
      } else {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
      }
    } catch (error) {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        error: 'فشل في التحقق من حالة المصادقة',
      });
    }
  }, []);

  // Login function
  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setState({
          user: data.data.user,
          isLoading: false,
          isAuthenticated: true,
          error: null,
        });
        return { success: true, data: data.data };
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: data.error || 'فشل في تسجيل الدخول',
        }));
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = 'حدث خطأ في الشبكة';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Register function
  const register = useCallback(async (userData: RegisterData) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
        }));
        return { success: true, data };
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: data.error || 'فشل في التسجيل',
        }));
        return { success: false, error: data.error, details: data.details };
      }
    } catch (error) {
      const errorMessage = 'حدث خطأ في الشبكة';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Logout function
  const logout = useCallback(async (logoutAll = false) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/auth/logout', {
        method: logoutAll ? 'DELETE' : 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          error: null,
        });
        router.push('/auth/login');
        return { success: true };
      } else {
        const data = await response.json();
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: data.error || 'فشل في تسجيل الخروج',
        }));
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = 'حدث خطأ في الشبكة';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, [router]);

  // Update user profile
  const updateProfile = useCallback(async (profileData: Partial<User>) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setState(prev => ({
          ...prev,
          user: { ...prev.user, ...data.user },
          isLoading: false,
          error: null,
        }));
        return { success: true, data: data.user };
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: data.error || 'فشل في تحديث الملف الشخصي',
        }));
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = 'حدث خطأ في الشبكة';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Change password
  const changePassword = useCallback(async (passwords: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(passwords),
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
        }));
        return { success: true, data };
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: data.error || 'فشل في تغيير كلمة المرور',
        }));
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = 'حدث خطأ في الشبكة';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Request password reset
  const requestPasswordReset = useCallback(async (email: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
        }));
        return { success: true, data };
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: data.error || 'فشل في إرسال رابط إعادة تعيين كلمة المرور',
        }));
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = 'حدث خطأ في الشبكة';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Verify email
  const verifyEmail = useCallback(async (token: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setState(prev => ({
          ...prev,
          user: prev.user ? { ...prev.user, emailVerified: true } : null,
          isLoading: false,
          error: null,
        }));
        return { success: true, data };
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: data.error || 'فشل في التحقق من البريد الإلكتروني',
        }));
        return { success: false, error: data.error };
      }
    } catch (error) {
      const errorMessage = 'حدث خطأ في الشبكة';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  // Check if user has permission
  const hasPermission = useCallback((permission: string): boolean => {
    return state.user?.role.permissions.includes(permission) || false;
  }, [state.user]);

  // Check if user has role
  const hasRole = useCallback((role: string): boolean => {
    return state.user?.role.name === role || false;
  }, [state.user]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Initialize auth check on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return {
    // State
    user: state.user,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,
    error: state.error,

    // Actions
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    requestPasswordReset,
    verifyEmail,
    checkAuth,
    clearError,

    // Utilities
    hasPermission,
    hasRole,
  };
}; 