// إعدادات شاملة لمشروع Sabq AI CMS
// يتضمن جميع متغيرات البيئة وإعدادات الخدمات المختلفة

export interface DatabaseConfig {
  url: string;
  maxConnections: number;
  timeout: number;
  ssl: boolean;
  pool: {
    min: number;
    max: number;
    idleTimeoutMillis: number;
  };
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  jwtSecret: string;
  bucketName: string;
}

export interface CloudinaryConfig {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  folder: string;
  transformation: {
    quality: string;
    format: string;
  };
}

export interface AuthConfig {
  jwtSecret: string;
  jwtExpiresIn: string;
  refreshTokenExpiresIn: string;
  bcryptRounds: number;
  sessionTimeout: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
}

export interface AIConfig {
  openai: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
    timeout: number;
  };
  anthropic: {
    apiKey: string;
    model: string;
    maxTokens: number;
    temperature: number;
    timeout: number;
  };
}

export interface SecurityConfig {
  rateLimiting: {
    windowMs: number;
    maxRequests: number;
    delayMs: number;
  };
  cors: {
    origin: string[];
    credentials: boolean;
    optionsSuccessStatus: number;
  };
  encryption: {
    algorithm: string;
    keyLength: number;
    ivLength: number;
  };
}

export interface AppConfig {
  name: string;
  version: string;
  environment: 'development' | 'production' | 'test';
  port: number;
  host: string;
  baseUrl: string;
  frontendUrl: string;
  apiVersion: string;
}

export interface Config {
  app: AppConfig;
  database: DatabaseConfig;
  supabase: SupabaseConfig;
  cloudinary: CloudinaryConfig;
  auth: AuthConfig;
  ai: AIConfig;
  security: SecurityConfig;
}

// دوال مساعدة لمعالجة متغيرات البيئة
const getEnvString = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`متغير البيئة ${key} مطلوب ولكنه غير موجود`);
  }
  return value || defaultValue!;
};

const getEnvNumber = (key: string, defaultValue?: number): number => {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`متغير البيئة ${key} مطلوب ولكنه غير موجود`);
  }
  if (!value) return defaultValue!;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`متغير البيئة ${key} يجب أن يكون رقم صحيح`);
  }
  return parsed;
};

const getEnvBoolean = (key: string, defaultValue?: boolean): boolean => {
  const value = process.env[key];
  if (!value && defaultValue === undefined) {
    throw new Error(`متغير البيئة ${key} مطلوب ولكنه غير موجود`);
  }
  if (!value) return defaultValue!;
  return value.toLowerCase() === 'true';
};

const getEnvArray = (key: string, defaultValue?: string[]): string[] => {
  const value = process.env[key];
  if (!value && !defaultValue) {
    throw new Error(`متغير البيئة ${key} مطلوب ولكنه غير موجود`);
  }
  if (!value) return defaultValue!;
  return value.split(',').map(item => item.trim());
};

// الإعدادات الأساسية
const config: Config = {
  app: {
    name: getEnvString('APP_NAME', 'Sabq AI CMS'),
    version: getEnvString('APP_VERSION', '1.0.0'),
    environment: getEnvString('NODE_ENV', 'development') as any,
    port: getEnvNumber('PORT', 3000),
    host: getEnvString('HOST', 'localhost'),
    baseUrl: getEnvString('BASE_URL', 'http://localhost:3000'),
    frontendUrl: getEnvString('FRONTEND_URL', 'http://localhost:3000'),
    apiVersion: getEnvString('API_VERSION', 'v1'),
  },

  database: {
    url: getEnvString('DATABASE_URL'),
    maxConnections: getEnvNumber('DB_MAX_CONNECTIONS', 10),
    timeout: getEnvNumber('DB_TIMEOUT', 30000),
    ssl: getEnvBoolean('DB_SSL', false),
    pool: {
      min: getEnvNumber('DB_POOL_MIN', 2),
      max: getEnvNumber('DB_POOL_MAX', 10),
      idleTimeoutMillis: getEnvNumber('DB_POOL_IDLE_TIMEOUT', 30000),
    },
  },

  supabase: {
    url: getEnvString('NEXT_PUBLIC_SUPABASE_URL'),
    anonKey: getEnvString('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    serviceRoleKey: getEnvString('SUPABASE_SERVICE_ROLE_KEY'),
    jwtSecret: getEnvString('SUPABASE_JWT_SECRET'),
    bucketName: getEnvString('SUPABASE_BUCKET_NAME', 'sabq-cms'),
  },

  cloudinary: {
    cloudName: getEnvString('CLOUDINARY_CLOUD_NAME'),
    apiKey: getEnvString('CLOUDINARY_API_KEY'),
    apiSecret: getEnvString('CLOUDINARY_API_SECRET'),
    folder: getEnvString('CLOUDINARY_FOLDER', 'sabq-cms'),
    transformation: {
      quality: getEnvString('CLOUDINARY_QUALITY', 'auto'),
      format: getEnvString('CLOUDINARY_FORMAT', 'auto'),
    },
  },

  auth: {
    jwtSecret: getEnvString('JWT_SECRET'),
    jwtExpiresIn: getEnvString('JWT_EXPIRES_IN', '24h'),
    refreshTokenExpiresIn: getEnvString('REFRESH_TOKEN_EXPIRES_IN', '7d'),
    bcryptRounds: getEnvNumber('BCRYPT_ROUNDS', 12),
    sessionTimeout: getEnvNumber('SESSION_TIMEOUT', 86400000), // 24 hours
    maxLoginAttempts: getEnvNumber('MAX_LOGIN_ATTEMPTS', 5),
    lockoutDuration: getEnvNumber('LOCKOUT_DURATION', 900000), // 15 minutes
  },

  ai: {
    openai: {
      apiKey: getEnvString('OPENAI_API_KEY'),
      model: getEnvString('OPENAI_MODEL', 'gpt-4'),
      maxTokens: getEnvNumber('OPENAI_MAX_TOKENS', 2000),
      temperature: parseFloat(getEnvString('OPENAI_TEMPERATURE', '0.7')),
      timeout: getEnvNumber('OPENAI_TIMEOUT', 30000),
    },
    anthropic: {
      apiKey: getEnvString('ANTHROPIC_API_KEY', ''),
      model: getEnvString('ANTHROPIC_MODEL', 'claude-3-sonnet-20240229'),
      maxTokens: getEnvNumber('ANTHROPIC_MAX_TOKENS', 2000),
      temperature: parseFloat(getEnvString('ANTHROPIC_TEMPERATURE', '0.7')),
      timeout: getEnvNumber('ANTHROPIC_TIMEOUT', 30000),
    },
  },

  security: {
    rateLimiting: {
      windowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 900000), // 15 minutes
      maxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
      delayMs: getEnvNumber('RATE_LIMIT_DELAY_MS', 1000),
    },
    cors: {
      origin: getEnvArray('CORS_ORIGIN', ['http://localhost:3000']),
      credentials: getEnvBoolean('CORS_CREDENTIALS', true),
      optionsSuccessStatus: getEnvNumber('CORS_OPTIONS_SUCCESS_STATUS', 200),
    },
    encryption: {
      algorithm: getEnvString('ENCRYPTION_ALGORITHM', 'aes-256-gcm'),
      keyLength: getEnvNumber('ENCRYPTION_KEY_LENGTH', 32),
      ivLength: getEnvNumber('ENCRYPTION_IV_LENGTH', 16),
    },
  },
};

// دالة التحقق من صحة الإعدادات
export const validateConfig = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // التحقق من الإعدادات الأساسية
  if (!config.app.name) errors.push('اسم التطبيق مطلوب');
  if (config.app.port < 1 || config.app.port > 65535) {
    errors.push('رقم المنفذ يجب أن يكون بين 1 و 65535');
  }

  // التحقق من قاعدة البيانات
  if (!config.database.url) errors.push('رابط قاعدة البيانات مطلوب');
  if (config.database.maxConnections < 1) {
    errors.push('عدد الاتصالات يجب أن يكون أكبر من 0');
  }

  // التحقق من Supabase
  if (!config.supabase.url) errors.push('رابط Supabase مطلوب');
  if (!config.supabase.anonKey) errors.push('مفتاح Supabase العام مطلوب');

  // التحقق من Cloudinary
  if (!config.cloudinary.cloudName) errors.push('اسم Cloudinary مطلوب');
  if (!config.cloudinary.apiKey) errors.push('مفتاح Cloudinary API مطلوب');

  // التحقق من المصادقة
  if (!config.auth.jwtSecret || config.auth.jwtSecret.length < 32) {
    errors.push('مفتاح JWT يجب أن يكون 32 حرف على الأقل');
  }
  if (config.auth.bcryptRounds < 10 || config.auth.bcryptRounds > 15) {
    errors.push('جولات bcrypt يجب أن تكون بين 10 و 15');
  }

  // التحقق من الذكاء الاصطناعي
  if (!config.ai.openai.apiKey) errors.push('مفتاح OpenAI API مطلوب');

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// دالة الحصول على معلومات البيئة
export const getEnvironmentInfo = () => {
  return {
    environment: config.app.environment,
    isDevelopment: config.app.environment === 'development',
    isProduction: config.app.environment === 'production',
    isTest: config.app.environment === 'test',
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
  };
};

// إعدادات مختلفة حسب البيئة
export const getEnvironmentConfig = (env: string) => {
  const baseConfig = { ...config };

  switch (env) {
    case 'development':
      return {
        ...baseConfig,
        security: {
          ...baseConfig.security,
          rateLimiting: {
            windowMs: 60000, // 1 minute in dev
            maxRequests: 1000,
            delayMs: 0,
          },
        },
      };

    case 'production':
      return {
        ...baseConfig,
        security: {
          ...baseConfig.security,
          rateLimiting: {
            windowMs: 900000, // 15 minutes in prod
            maxRequests: 100,
            delayMs: 1000,
          },
        },
      };

    case 'test':
      return {
        ...baseConfig,
        database: {
          ...baseConfig.database,
          url: getEnvString('TEST_DATABASE_URL', 'sqlite::memory:'),
        },
        auth: {
          ...baseConfig.auth,
          bcryptRounds: 4, // أسرع في الاختبارات
        },
      };

    default:
      return baseConfig;
  }
};

// دالة للحصول على الإعدادات الحالية
export const getCurrentEnvironmentConfig = () => {
  return getEnvironmentConfig(config.app.environment);
};

export default config; 