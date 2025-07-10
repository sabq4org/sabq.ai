// إعداد بيئة الاختبارات لـ Sabq AI CMS

// تعيين متغيرات البيئة للاختبارات
Object.defineProperty(process.env, 'NODE_ENV', { value: 'test', writable: true });
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-very-secure-and-long';
process.env.DATABASE_URL = 'sqlite::memory:';
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';
process.env.SUPABASE_JWT_SECRET = 'test-jwt-secret';
process.env.CLOUDINARY_CLOUD_NAME = 'test-cloud';
process.env.CLOUDINARY_API_KEY = 'test-api-key';
process.env.CLOUDINARY_API_SECRET = 'test-api-secret';
process.env.OPENAI_API_KEY = 'sk-test123456789';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';

// إعداد timeout أطول للاختبارات
jest.setTimeout(30000);

// تنظيف console.log في الاختبارات
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}; 