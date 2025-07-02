# 🚀 منصة سبق الذكية - Sabq AI CMS

<div align="center">

![Next.js](https://img.shields.io/badge/Next.js-15.3.3-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

[العربية](#العربية) | [English](#english)

</div>

---

<div dir="rtl">

## العربية

### 📋 نظرة عامة

نظام إدارة محتوى ذكي لصحيفة سبق الإلكترونية، مبني باستخدام Next.js 15 مع دعم الذكاء الاصطناعي والتخصيص الذكي للمحتوى.

### 🌟 Features / المميزات

- **🤖 ذكاء اصطناعي متقدم**: تحليل عميق للمقالات وتوصيات ذكية
- **📱 تصميم متجاوب**: يعمل على جميع الأجهزة والشاشات
- **🌙 وضع ليلي/نهاري**: تجربة قراءة مريحة في جميع الأوقات
- **🎯 محتوى مخصص**: توصيات مخصصة حسب اهتمامات القارئ
- **🏆 نظام نقاط الولاء**: مكافآت للقراء النشطين
- **📊 لوحة تحكم متقدمة**: إحصائيات وتحليلات شاملة
- **🔐 نظام مصادقة آمن**: تسجيل دخول وإدارة صلاحيات
- **⚡ أداء فائق**: تحميل سريع وتجربة سلسة

### 🛠️ التقنيات المستخدمة

- **Frontend**: Next.js 15.3.3 (App Router) + Turbopack
- **Styling**: Tailwind CSS + Custom CSS
- **Language**: TypeScript
- **Icons**: Lucide React
- **State**: React Hooks + localStorage
- **API**: RESTful JSON
- **Database ORM**: Prisma 6.10.1 (جاهز للاستخدام)

### 🗄️ قاعدة البيانات (Prisma ORM)

المشروع مُعد للعمل مع Prisma ORM ويدعم PostgreSQL/MySQL/SQLite:

```bash
# إعداد قاعدة البيانات
npm run prisma:push        # إنشاء الجداول من Schema

# أدوات مفيدة
npm run prisma:studio      # فتح واجهة إدارة البيانات
npm run prisma:generate    # توليد Prisma Client
npm run db:migrate         # نقل البيانات من JSON لقاعدة البيانات

# للمزيد من التفاصيل
راجع PRISMA_INTEGRATION_GUIDE.md
```

### 🚀 البدء السريع

> 📋 **للحصول على تعليمات نشر مفصلة وحل المشاكل، راجع [DEPLOYMENT_INSTRUCTIONS.md](./DEPLOYMENT_INSTRUCTIONS.md)**

### Prerequisites / المتطلبات

- Node.js 18+ 
- npm or yarn
- Git

### Installation / التثبيت

```bash
# Clone the repository
git clone https://github.com/your-username/sabq-ai-cms.git
cd sabq-ai-cms

# Install dependencies
npm install

# Copy environment variables
cp env.example .env.local

# Run development server
npm run dev
```

### Environment Variables / متغيرات البيئة

Create a `.env.local` file:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Authentication
JWT_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret

# AI Configuration (Optional)
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key

# Database (Prisma - PostgreSQL/MySQL/SQLite)
DATABASE_URL=postgresql://username:password@localhost:5432/sabq_db
# أو MySQL:
# DATABASE_URL=mysql://username:password@localhost:3306/sabq_db
# أو SQLite للتطوير:
# DATABASE_URL=file:./dev.db

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 📁 بنية المشروع

```
sabq-ai-cms/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── dashboard/         # Admin dashboard
│   └── ...               # Other pages
├── components/            # React components
├── contexts/             # React contexts
├── hooks/                # Custom hooks
├── lib/                  # Utility functions
├── public/               # Static files
├── styles/               # CSS files
├── types/                # TypeScript types
└── data/                 # JSON data files
```

### 🛠️ Scripts / الأوامر

```bash
# Development
npm run dev              # Start development server

# Production
npm run build           # Build for production
npm run start          # Start production server

# Testing
npm run test           # Run tests
npm run lint          # Run ESLint

# Database
npm run db:seed       # Seed database with sample data
npm run db:reset     # Reset database
```

### 🌐 Deployment / النشر

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/sabq-ai-cms)

### Manual Deployment

1. **Build the project:**
```bash
npm run build
```

2. **Set production environment variables**

3. **Start the server:**
```bash
npm run start
```

### Docker

```bash
# Build image
docker build -t sabq-ai-cms .

# Run container
docker run -p 3000:3000 sabq-ai-cms
```

### 📱 Default Accounts / الحسابات الافتراضية

### حساب المدير:
- **البريد**: ali@alhazm.org
- **كلمة المرور**: 123456

### حساب المستخدم:
- **البريد**: sabq@icloud.com
- **كلمة المرور**: 123456

### 🔧 Configuration / الإعدادات

### AI Features
- Enable/disable AI features in `config/ai.config.ts`
- Configure AI models and parameters

### Theme Customization
- Edit theme colors in `tailwind.config.js`
- Modify dark mode settings in `contexts/ThemeContext.tsx`

### Content Management
- Articles are stored in `data/articles.json`
- Categories in `data/categories.json`
- Users in `data/users.json`

### 🤝 المساهمة

<div dir="rtl">

1. Fork المشروع
2. أنشئ فرع للميزة (`git checkout -b feature/amazing-feature`)
3. Commit التغييرات (`git commit -m 'Add amazing feature'`)
4. Push للفرع (`git push origin feature/amazing-feature`)
5. افتح Pull Request

</div>

### 📄 الترخيص

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### 🙏 Acknowledgments / شكر وتقدير

<div dir="rtl">

- فريق Next.js للإطار الرائع
- مجتمع React للمكونات والأدوات
- جميع المساهمين في المشروع

</div>

### 📞 Support / الدعم

<div dir="rtl">

للدعم والاستفسارات:
- 📧 Email: support@sabq-ai.com
- 💬 Discord: [Join our server](https://discord.gg/sabq-ai)
- 📱 Twitter: [@sabq_ai](https://twitter.com/sabq_ai)

</div>

---

<div align="center" dir="rtl">
صنع بـ ❤️ لصحيفة سبق
</div>

</div>

---

## English

### 📝 Overview

An advanced smart news platform built with cutting-edge technologies, delivering an exceptional user experience with AI and an innovative loyalty points system.

### ✨ Key Features

- **Smart Homepage**: Hero section with breaking news ticker, 8 smart blocks
- **Article System**: Advanced content display, AI summaries, reading progress
- **Categories**: Full category system with dedicated pages
- **Loyalty Points**: 4-tier system (Bronze, Silver, Gold, Platinum)
- **User System**: Enhanced login/register with beautiful UI

### 🛠️ Tech Stack

- Next.js 15.3.3 (App Router) + Turbopack
- TypeScript + Tailwind CSS
- Lucide React Icons
- RESTful API

### 🚀 Quick Start

```bash
# Clone the project
git clone https://github.com/sabq4org/sabq-ai-cms.git
cd sabq-ai-cms

# Install dependencies
npm install

# Run development server
npm run dev

# Open browser at
http://localhost:3001
```

### 📄 License

This project is licensed under the MIT License.

---

<div align="center">

**Made with ❤️ by Ali Alhazmi**

[🌟 Star us on GitHub](https://github.com/sabq4org/sabq-ai-cms)

</div>
# آخر تحديث: Sat Jun 28 15:27:15 +03 2025
