// إعدادات قاعدة البيانات حسب البيئة
export const getDatabaseUrl = () => {
  const env = process.env.NODE_ENV || 'development'
  const isStaging = process.env.VERCEL_ENV === 'preview' || process.env.APP_ENV === 'staging'
  
  if (env === 'production' && !isStaging) {
    return process.env.DATABASE_URL
  } else if (isStaging) {
    return process.env.DATABASE_URL_STAGING || process.env.DATABASE_URL
  } else {
    return process.env.DATABASE_URL_DEV || process.env.DATABASE_URL
  }
}

// إعدادات Redis حسب البيئة
export const getRedisConfig = () => {
  const env = process.env.NODE_ENV || 'development'
  const isStaging = process.env.VERCEL_ENV === 'preview' || process.env.APP_ENV === 'staging'
  
  if (env === 'production' && !isStaging) {
    return {
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!
    }
  } else if (isStaging) {
    return {
      url: process.env.UPSTASH_REDIS_REST_URL_STAGING || process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN_STAGING || process.env.UPSTASH_REDIS_REST_TOKEN!
    }
  } else {
    return {
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!
    }
  }
}

// إعدادات PlanetScale الموصى بها
export const planetScaleConfig = {
  // Connection pool settings
  connectionLimit: 1000, // PlanetScale يدير هذا تلقائياً
  
  // SSL مطلوب دائماً
  ssl: {
    rejectUnauthorized: true
  },
  
  // Timeouts
  connectTimeout: 60000,
  
  // للأداء الأفضل
  decimalNumbers: true,
  
  // تفعيل query caching
  cache: true
}

// مساعد للحصول على اسم قاعدة البيانات
export const getDatabaseName = () => {
  const env = process.env.NODE_ENV || 'development'
  const isStaging = process.env.VERCEL_ENV === 'preview' || process.env.APP_ENV === 'staging'
  
  if (env === 'production' && !isStaging) {
    return 'sabq-ai-prod'
  } else if (isStaging) {
    return 'sabq-ai-staging'
  } else {
    return 'sabq-ai-dev'
  }
} 