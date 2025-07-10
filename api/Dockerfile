# Multi-stage build for Sabq AI CMS Backend
FROM node:18-alpine AS builder

# تعيين دليل العمل
WORKDIR /app

# نسخ ملفات package للاستفادة من Docker layer caching
COPY package*.json ./
COPY prisma/ ./prisma/

# تثبيت التبعيات
RUN npm ci --only=production

# إنشاء عميل Prisma
RUN npx prisma generate

# نسخ الكود المصدري
COPY . .

# بناء التطبيق
RUN npm run build

# مرحلة الإنتاج
FROM node:18-alpine AS production

# إنشاء مستخدم غير root للأمان
RUN addgroup -g 1001 -S nodejs && \
    adduser -S sabq -u 1001

# تثبيت الأدوات المطلوبة
RUN apk add --no-cache dumb-init

# تعيين دليل العمل
WORKDIR /app

# نسخ الملفات من مرحلة البناء
COPY --from=builder --chown=sabq:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=sabq:nodejs /app/dist ./dist
COPY --from=builder --chown=sabq:nodejs /app/prisma ./prisma
COPY --from=builder --chown=sabq:nodejs /app/package*.json ./

# تعيين متغيرات البيئة
ENV NODE_ENV=production
ENV PORT=4000

# فتح المنفذ
EXPOSE 4000

# التبديل للمستخدم غير root
USER sabq

# تشغيل التطبيق مع dumb-init للتعامل مع الإشارات بشكل صحيح
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]

# إضافة metadata
LABEL maintainer="Sabq AI Team <dev@sabq.ai>"
LABEL version="2.1.0"
LABEL description="Sabq AI CMS Backend - Node.js Express TypeScript" 