// اختبارات شاملة لملف إعدادات المشروع
// يتضمن اختبارات متغيرات البيئة والإعدادات المختلفة

import {
  validateConfig,
  getEnvironmentInfo,
  getEnvironmentConfig,
  getCurrentEnvironmentConfig,
} from '../../lib/config';

// Mock متغيرات البيئة للاختبارات
const originalEnv = process.env;

describe('Config Tests - اختبارات الإعدادات', () => {
  beforeEach(() => {
    // إعادة تعيين متغيرات البيئة لكل اختبار
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // استعادة متغيرات البيئة الأصلية
    process.env = originalEnv;
  });

  describe('Environment Variables - متغيرات البيئة', () => {
    test('يجب أن يقرأ متغيرات البيئة الأساسية بشكل صحيح', () => {
      // إعداد متغيرات البيئة للاختبار
      process.env.APP_NAME = 'Test Sabq CMS';
      process.env.NODE_ENV = 'test';
      process.env.PORT = '4000';
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
      process.env.CLOUDINARY_API_KEY = 'test-api-key';
      process.env.JWT_SECRET = 'test-jwt-secret-very-long-and-secure';
      process.env.OPENAI_API_KEY = 'sk-test123456789';

      // إعادة تحميل المكتبة مع المتغيرات الجديدة
      const config = require('../../lib/config').default;

      expect(config.app.name).toBe('Test Sabq CMS');
      expect(config.app.environment).toBe('test');
      expect(config.app.port).toBe(4000);
      expect(config.database.url).toBe('postgresql://test:test@localhost:5432/testdb');
      expect(config.supabase.url).toBe('https://test.supabase.co');
    });

    test('يجب أن يستخدم القيم الافتراضية عند عدم وجود متغيرات البيئة', () => {
      // إزالة متغيرات البيئة الاختيارية
      delete process.env.APP_VERSION;
      delete process.env.HOST;
      delete process.env.API_VERSION;
      
      // تعيين المتغيرات المطلوبة فقط
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
      process.env.CLOUDINARY_API_KEY = 'test-api-key';
      process.env.JWT_SECRET = 'test-jwt-secret-very-long-and-secure';
      process.env.OPENAI_API_KEY = 'sk-test123456789';

      const config = require('../../lib/config').default;

      expect(config.app.version).toBe('1.0.0');
      expect(config.app.host).toBe('localhost');
      expect(config.app.apiVersion).toBe('v1');
    });

    test('يجب أن يحول الأرقام من النصوص بشكل صحيح', () => {
      process.env.PORT = '8080';
      process.env.DB_MAX_CONNECTIONS = '20';
      process.env.BCRYPT_ROUNDS = '14';
      
      // المتغيرات المطلوبة
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
      process.env.CLOUDINARY_API_KEY = 'test-api-key';
      process.env.JWT_SECRET = 'test-jwt-secret-very-long-and-secure';
      process.env.OPENAI_API_KEY = 'sk-test123456789';

      const config = require('../../lib/config').default;

      expect(config.app.port).toBe(8080);
      expect(config.database.maxConnections).toBe(20);
      expect(config.auth.bcryptRounds).toBe(14);
    });

    test('يجب أن يحول القيم المنطقية من النصوص بشكل صحيح', () => {
      process.env.DB_SSL = 'true';
      process.env.CORS_CREDENTIALS = 'false';
      
      // المتغيرات المطلوبة
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
      process.env.CLOUDINARY_API_KEY = 'test-api-key';
      process.env.JWT_SECRET = 'test-jwt-secret-very-long-and-secure';
      process.env.OPENAI_API_KEY = 'sk-test123456789';

      const config = require('../../lib/config').default;

      expect(config.database.ssl).toBe(true);
      expect(config.security.cors.credentials).toBe(false);
    });

    test('يجب أن يحول المصفوفات من النصوص المفصولة بفواصل', () => {
      process.env.CORS_ORIGIN = 'http://localhost:3000,https://sabq.org,https://cms.sabq.org';
      
      // المتغيرات المطلوبة
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
      process.env.CLOUDINARY_API_KEY = 'test-api-key';
      process.env.JWT_SECRET = 'test-jwt-secret-very-long-and-secure';
      process.env.OPENAI_API_KEY = 'sk-test123456789';

      const config = require('../../lib/config').default;

      expect(config.security.cors.origin).toEqual([
        'http://localhost:3000',
        'https://sabq.org',
        'https://cms.sabq.org'
      ]);
    });

    test('يجب أن يرمي خطأ عند فقدان متغيرات البيئة المطلوبة', () => {
      // حذف متغير مطلوب
      delete process.env.DATABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      expect(() => {
        require('../../lib/config');
      }).toThrow();
    });
  });

  describe('validateConfig Function - دالة التحقق من الإعدادات', () => {
    beforeEach(() => {
      // إعداد متغيرات بيئة صحيحة لكل اختبار
      process.env.APP_NAME = 'Test App';
      process.env.PORT = '3000';
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
      process.env.CLOUDINARY_API_KEY = 'test-api-key';
      process.env.JWT_SECRET = 'test-jwt-secret-very-long-and-secure-more-than-32-chars';
      process.env.OPENAI_API_KEY = 'sk-test123456789';
      process.env.BCRYPT_ROUNDS = '12';
    });

    test('يجب أن يعيد صحيح للإعدادات الصحيحة', () => {
      const result = validateConfig();
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('يجب أن يكتشف منفذ غير صحيح', () => {
      process.env.PORT = '70000'; // أكبر من 65535
      
      const result = validateConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('رقم المنفذ يجب أن يكون بين 1 و 65535');
    });

    test('يجب أن يكتشف مفتاح JWT قصير', () => {
      process.env.JWT_SECRET = 'short'; // أقل من 32 حرف
      
      const result = validateConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('مفتاح JWT يجب أن يكون 32 حرف على الأقل');
    });

    test('يجب أن يكتشف جولات bcrypt غير صحيحة', () => {
      process.env.BCRYPT_ROUNDS = '5'; // أقل من 10
      
      const result = validateConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('جولات bcrypt يجب أن تكون بين 10 و 15');
    });

    test('يجب أن يكتشف متغيرات البيئة المفقودة', () => {
      delete process.env.DATABASE_URL;
      delete process.env.CLOUDINARY_CLOUD_NAME;
      delete process.env.OPENAI_API_KEY;
      
      const result = validateConfig();
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('getEnvironmentInfo Function - دالة معلومات البيئة', () => {
    test('يجب أن يعيد معلومات البيئة الصحيحة', () => {
      process.env.NODE_ENV = 'development';
      
      const envInfo = getEnvironmentInfo();
      
      expect(envInfo).toHaveProperty('environment');
      expect(envInfo).toHaveProperty('isDevelopment');
      expect(envInfo).toHaveProperty('isProduction');
      expect(envInfo).toHaveProperty('isTest');
      expect(envInfo).toHaveProperty('nodeVersion');
      expect(envInfo).toHaveProperty('platform');
      expect(envInfo).toHaveProperty('arch');
    });

    test('يجب أن يحدد بيئة التطوير بشكل صحيح', () => {
      process.env.NODE_ENV = 'development';
      
      const envInfo = getEnvironmentInfo();
      
      expect(envInfo.environment).toBe('development');
      expect(envInfo.isDevelopment).toBe(true);
      expect(envInfo.isProduction).toBe(false);
      expect(envInfo.isTest).toBe(false);
    });

    test('يجب أن يحدد بيئة الإنتاج بشكل صحيح', () => {
      process.env.NODE_ENV = 'production';
      
      const envInfo = getEnvironmentInfo();
      
      expect(envInfo.environment).toBe('production');
      expect(envInfo.isDevelopment).toBe(false);
      expect(envInfo.isProduction).toBe(true);
      expect(envInfo.isTest).toBe(false);
    });
  });

  describe('getEnvironmentConfig Function - دالة إعدادات البيئة', () => {
    beforeEach(() => {
      // إعداد متغيرات أساسية
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
      process.env.CLOUDINARY_API_KEY = 'test-api-key';
      process.env.JWT_SECRET = 'test-jwt-secret-very-long-and-secure';
      process.env.OPENAI_API_KEY = 'sk-test123456789';
    });

    test('يجب أن يعيد إعدادات التطوير الصحيحة', () => {
      const devConfig = getEnvironmentConfig('development');
      
      expect(devConfig.security.rateLimiting.windowMs).toBe(60000); // 1 minute
      expect(devConfig.security.rateLimiting.maxRequests).toBe(1000);
      expect(devConfig.security.rateLimiting.delayMs).toBe(0);
    });

    test('يجب أن يعيد إعدادات الإنتاج الصحيحة', () => {
      const prodConfig = getEnvironmentConfig('production');
      
      expect(prodConfig.security.rateLimiting.windowMs).toBe(900000); // 15 minutes
      expect(prodConfig.security.rateLimiting.maxRequests).toBe(100);
      expect(prodConfig.security.rateLimiting.delayMs).toBe(1000);
    });

    test('يجب أن يعيد إعدادات الاختبار الصحيحة', () => {
      process.env.TEST_DATABASE_URL = 'sqlite::memory:';
      
      const testConfig = getEnvironmentConfig('test');
      
      expect(testConfig.database.url).toBe('sqlite::memory:');
      expect(testConfig.auth.bcryptRounds).toBe(4); // أسرع للاختبارات
    });

    test('يجب أن يعيد الإعدادات الافتراضية للبيئات غير المعروفة', () => {
      const unknownConfig = getEnvironmentConfig('unknown');
      
      // يجب أن يكون مثل الإعدادات الأساسية
      expect(unknownConfig).toBeDefined();
      expect(unknownConfig.app).toBeDefined();
      expect(unknownConfig.database).toBeDefined();
    });
  });

  describe('getCurrentEnvironmentConfig Function - دالة الإعدادات الحالية', () => {
    test('يجب أن يعيد إعدادات البيئة الحالية', () => {
      process.env.NODE_ENV = 'test';
      
      // إعداد متغيرات أساسية
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
      process.env.CLOUDINARY_API_KEY = 'test-api-key';
      process.env.JWT_SECRET = 'test-jwt-secret-very-long-and-secure';
      process.env.OPENAI_API_KEY = 'sk-test123456789';
      
      const currentConfig = getCurrentEnvironmentConfig();
      
      expect(currentConfig).toBeDefined();
      expect(currentConfig.auth.bcryptRounds).toBe(4); // إعدادات الاختبار
    });
  });

  describe('TypeScript Types - أنواع البيانات', () => {
    test('يجب أن تكون أنواع البيانات صحيحة', () => {
      // إعداد متغيرات أساسية
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
      process.env.CLOUDINARY_API_KEY = 'test-api-key';
      process.env.JWT_SECRET = 'test-jwt-secret-very-long-and-secure';
      process.env.OPENAI_API_KEY = 'sk-test123456789';
      
      const config = require('../../lib/config').default;
      
      // التحقق من أنواع البيانات
      expect(typeof config.app.name).toBe('string');
      expect(typeof config.app.port).toBe('number');
      expect(typeof config.database.ssl).toBe('boolean');
      expect(Array.isArray(config.security.cors.origin)).toBe(true);
    });

    test('يجب أن تدعم const assertions', () => {
      // اختبار أن environment محدود لقيم معينة
      const environments = ['development', 'production', 'test'] as const;
      
      environments.forEach(env => {
        const envConfig = getEnvironmentConfig(env);
        expect(envConfig).toBeDefined();
      });
    });
  });

  describe('Edge Cases - الحالات الحدية', () => {
    test('يجب أن يتعامل مع القيم الفارغة', () => {
      process.env.APP_NAME = '';
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
      process.env.CLOUDINARY_API_KEY = 'test-api-key';
      process.env.JWT_SECRET = 'test-jwt-secret-very-long-and-secure';
      process.env.OPENAI_API_KEY = 'sk-test123456789';
      
      expect(() => {
        require('../../lib/config');
      }).toThrow();
    });

    test('يجب أن يتعامل مع القيم الرقمية غير الصحيحة', () => {
      process.env.PORT = 'not-a-number';
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
      process.env.CLOUDINARY_API_KEY = 'test-api-key';
      process.env.JWT_SECRET = 'test-jwt-secret-very-long-and-secure';
      process.env.OPENAI_API_KEY = 'sk-test123456789';
      
      expect(() => {
        require('../../lib/config');
      }).toThrow();
    });

    test('يجب أن يتعامل مع المصفوفات الفارغة', () => {
      process.env.CORS_ORIGIN = '';
      process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
      process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
      process.env.CLOUDINARY_API_KEY = 'test-api-key';
      process.env.JWT_SECRET = 'test-jwt-secret-very-long-and-secure';
      process.env.OPENAI_API_KEY = 'sk-test123456789';
      
      expect(() => {
        require('../../lib/config');
      }).toThrow();
    });
  });
}); 