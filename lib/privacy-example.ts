/**
 * أمثلة تطبيقية لاستخدام مكتبة الخصوصية
 * Privacy Controls Usage Examples
 * @version 1.0.0
 * @author Sabq AI Team
 */

import {
  privacyManager,
  PersonalDataType,
  ProcessingPurpose,
  PrivacyPreferences,
  UserData,
  createDefaultPrivacyPreferences,
  validatePersonalData,
  sanitizePersonalData
} from './privacy-controls';

/**
 * مثال شامل على إدارة بيانات المستخدم
 */
export class PrivacyUsageExample {
  
  /**
   * مثال على إنشاء مستخدم جديد مع تفضيلات الخصوصية
   */
  static async createNewUser(email: string, name: string, phone?: string): Promise<UserData> {
    // التحقق من صحة البيانات أولاً
    if (!validatePersonalData(email, PersonalDataType.EMAIL)) {
      throw new Error('عنوان البريد الإلكتروني غير صحيح');
    }
    
    if (!validatePersonalData(name, PersonalDataType.NAME)) {
      throw new Error('الاسم غير صحيح');
    }

    if (phone && !validatePersonalData(phone, PersonalDataType.PHONE)) {
      throw new Error('رقم الهاتف غير صحيح');
    }

    // إنشاء تفضيلات خصوصية افتراضية
    const defaultPreferences = createDefaultPrivacyPreferences();
    
    // السماح بالتخصيص فقط بشكل افتراضي
    const preferences: PrivacyPreferences = {
      ...defaultPreferences,
      allowPersonalization: true,
      allowAnalytics: false,
      allowMarketing: false
    };

    const userData: UserData = {
      id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email,
      name,
      phone,
      preferences,
      metadata: {
        createdAt: new Date(),
        lastUpdated: new Date(),
        dataRetentionDate: new Date(Date.now() + preferences.dataRetentionPeriod * 24 * 60 * 60 * 1000)
      }
    };

    // تسجيل عملية إنشاء البيانات
    await privacyManager.logDataProcessing({
      id: privacyManager['generateId'](),
      userId: userData.id,
      action: 'create',
      dataType: PersonalDataType.EMAIL,
      purpose: ProcessingPurpose.AUTHENTICATION,
      timestamp: new Date(),
      ipAddress: 'system',
      justification: 'User account creation'
    });

    console.log('✅ تم إنشاء المستخدم بنجاح مع تفضيلات الخصوصية');
    return userData;
  }

  /**
   * مثال على تشفير وحفظ البيانات الحساسة
   */
  static async secureUserData(userData: UserData): Promise<any> {
    const securedData: any = {};

    // تشفير البريد الإلكتروني
    if (userData.email) {
      securedData.encryptedEmail = await privacyManager.encryptPersonalData(
        userData.email,
        PersonalDataType.EMAIL
      );
    }

    // تشفير رقم الهاتف (إذا وجد)
    if (userData.phone) {
      securedData.encryptedPhone = await privacyManager.encryptPersonalData(
        userData.phone,
        PersonalDataType.PHONE
      );
    }

    // تشفير الاسم
    if (userData.name) {
      securedData.encryptedName = await privacyManager.encryptPersonalData(
        userData.name,
        PersonalDataType.NAME
      );
    }

    // حفظ التفضيلات والبيانات الوصفية بدون تشفير
    securedData.preferences = userData.preferences;
    securedData.metadata = userData.metadata;
    securedData.id = userData.id;

    console.log('🔒 تم تشفير البيانات الشخصية بنجاح');
    return securedData;
  }

  /**
   * مثال على فك تشفير البيانات
   */
  static async decryptUserData(securedData: any): Promise<UserData> {
    const userData: UserData = {
      id: securedData.id,
      preferences: securedData.preferences,
      metadata: securedData.metadata
    };

    // فك تشفير البريد الإلكتروني
    if (securedData.encryptedEmail) {
      userData.email = await privacyManager.decryptPersonalData(
        securedData.encryptedEmail,
        PersonalDataType.EMAIL
      );
    }

    // فك تشفير رقم الهاتف
    if (securedData.encryptedPhone) {
      userData.phone = await privacyManager.decryptPersonalData(
        securedData.encryptedPhone,
        PersonalDataType.PHONE
      );
    }

    // فك تشفير الاسم
    if (securedData.encryptedName) {
      userData.name = await privacyManager.decryptPersonalData(
        securedData.encryptedName,
        PersonalDataType.NAME
      );
    }

    console.log('🔓 تم فك تشفير البيانات بنجاح');
    return userData;
  }

  /**
   * مثال على التحقق من الموافقة قبل معالجة البيانات
   */
  static checkDataProcessingConsent(
    preferences: PrivacyPreferences,
    purpose: ProcessingPurpose
  ): boolean {
    const hasConsent = privacyManager.validateConsent(preferences, purpose);
    
    if (hasConsent) {
      console.log(`✅ المستخدم وافق على معالجة البيانات للغرض: ${purpose}`);
    } else {
      console.log(`❌ المستخدم لم يوافق على معالجة البيانات للغرض: ${purpose}`);
    }

    return hasConsent;
  }

  /**
   * مثال على إخفاء هوية البيانات للتحليلات
   */
  static anonymizeForAnalytics(userData: UserData): any {
    const anonymizedData = privacyManager.anonymizeData(userData);
    
    console.log('🎭 تم إخفاء هوية البيانات للتحليلات:');
    console.log(JSON.stringify(anonymizedData, null, 2));
    
    return anonymizedData;
  }

  /**
   * مثال على تصدير بيانات المستخدم
   */
  static async exportUserDataExample(userId: string): Promise<any> {
    const exportedData = await privacyManager.exportUserData(userId);
    
    console.log('📤 تم تصدير بيانات المستخدم:');
    console.log(JSON.stringify(exportedData, null, 2));
    
    return exportedData;
  }

  /**
   * مثال على حذف بيانات المستخدم
   */
  static async deleteUserDataExample(userId: string): Promise<boolean> {
    const success = await privacyManager.deletePersonalData(userId);
    
    if (success) {
      console.log('🗑️ تم حذف بيانات المستخدم بنجاح');
    } else {
      console.log('❌ فشل في حذف بيانات المستخدم');
    }
    
    return success;
  }

  /**
   * مثال على تنظيف النصوص من البيانات الشخصية
   */
  static sanitizeTextExample(text: string): string {
    const sanitized = sanitizePersonalData(text);
    
    console.log('🧼 النص الأصلي:', text);
    console.log('🧽 النص المنظف:', sanitized);
    
    return sanitized;
  }

  /**
   * مثال شامل على سيناريو كامل
   */
  static async fullWorkflowExample(): Promise<void> {
    console.log('🚀 بدء مثال شامل على سير العمل:');
    console.log('================================');

    try {
      // 1. إنشاء مستخدم جديد
      console.log('\n1️⃣ إنشاء مستخدم جديد...');
      const user = await this.createNewUser(
        'ahmed.hassan@example.com',
        'أحمد حسن',
        '+966501234567'
      );

      // 2. تشفير البيانات
      console.log('\n2️⃣ تشفير البيانات...');
      const securedData = await this.secureUserData(user);

      // 3. فك التشفير
      console.log('\n3️⃣ فك تشفير البيانات...');
      const decryptedUser = await this.decryptUserData(securedData);

      // 4. التحقق من الموافقة
      console.log('\n4️⃣ التحقق من الموافقة...');
      this.checkDataProcessingConsent(user.preferences, ProcessingPurpose.ANALYTICS);
      this.checkDataProcessingConsent(user.preferences, ProcessingPurpose.PERSONALIZATION);

      // 5. إخفاء الهوية
      console.log('\n5️⃣ إخفاء هوية البيانات...');
      this.anonymizeForAnalytics(user);

      // 6. تنظيف النص
      console.log('\n6️⃣ تنظيف النص...');
      this.sanitizeTextExample(
        'تواصل مع أحمد على ahmed.hassan@example.com أو 966501234567'
      );

      // 7. تصدير البيانات
      console.log('\n7️⃣ تصدير البيانات...');
      await this.exportUserDataExample(user.id);

      console.log('\n✅ اكتمل المثال الشامل بنجاح!');

    } catch (error) {
      console.error('❌ خطأ في المثال الشامل:', error);
    }
  }
}

/**
 * أمثلة على سيناريوهات مختلفة
 */
export class PrivacyScenarios {

  /**
   * سيناريو: موقع إخباري
   */
  static async newsWebsiteScenario(): Promise<void> {
    console.log('📰 سيناريو: موقع إخباري');
    console.log('====================');

    const user = await PrivacyUsageExample.createNewUser(
      'reader@example.com',
      'قارئ الأخبار'
    );

    // المستخدم يوافق على التخصيص فقط
    user.preferences.allowPersonalization = true;
    user.preferences.allowAnalytics = false;
    user.preferences.allowMarketing = false;

    // التحقق من الموافقة لتخصيص المحتوى
    const canPersonalize = PrivacyUsageExample.checkDataProcessingConsent(
      user.preferences,
      ProcessingPurpose.PERSONALIZATION
    );

    if (canPersonalize) {
      console.log('👤 سيتم تخصيص المحتوى للمستخدم');
    }

    // عدم إجراء تحليلات إذا لم يوافق المستخدم
    const canAnalyze = PrivacyUsageExample.checkDataProcessingConsent(
      user.preferences,
      ProcessingPurpose.ANALYTICS
    );

    if (!canAnalyze) {
      console.log('📊 لن يتم تضمين هذا المستخدم في التحليلات');
      // يمكن استخدام البيانات مخفية الهوية فقط
      PrivacyUsageExample.anonymizeForAnalytics(user);
    }
  }

  /**
   * سيناريو: منصة تجارة إلكترونية
   */
  static async ecommerceScenario(): Promise<void> {
    console.log('🛒 سيناريو: منصة تجارة إلكترونية');
    console.log('=============================');

    const user = await PrivacyUsageExample.createNewUser(
      'customer@example.com',
      'عميل المتجر',
      '+966501234567'
    );

    // العميل يوافق على جميع الأغراض للحصول على تجربة أفضل
    user.preferences.allowPersonalization = true;
    user.preferences.allowAnalytics = true;
    user.preferences.allowMarketing = true;

    // تشفير بيانات الدفع الحساسة
    const creditCardInfo = '1234-5678-9012-3456';
    const encryptedCC = await privacyManager.encryptPersonalData(
      creditCardInfo,
      PersonalDataType.FINANCIAL
    );

    console.log('💳 تم تشفير بيانات بطاقة الائتمان');

    // إرسال عروض تسويقية (بناء على الموافقة)
    if (PrivacyUsageExample.checkDataProcessingConsent(user.preferences, ProcessingPurpose.MARKETING)) {
      console.log('📧 سيتم إرسال عروض تسويقية للعميل');
    }
  }

  /**
   * سيناريو: تطبيق صحي
   */
  static async healthAppScenario(): Promise<void> {
    console.log('🏥 سيناريو: تطبيق صحي');
    console.log('===================');

    const user = await PrivacyUsageExample.createNewUser(
      'patient@example.com',
      'المريض'
    );

    // البيانات الصحية حساسة جداً
    const healthData = 'ضغط الدم: 120/80, السكر: 95, الكوليسترول: 180';
    const encryptedHealth = await privacyManager.encryptPersonalData(
      healthData,
      PersonalDataType.HEALTH
    );

    console.log('🔒 تم تشفير البيانات الصحية بأعلى مستوى أمان');

    // البيانات الصحية تحتاج موافقة صريحة لكل استخدام
    console.log('⚕️ البيانات الصحية تتطلب موافقة صريحة لكل معالجة');
  }
}

/**
 * مساعدات للاختبار والتطوير
 */
export class PrivacyTestHelpers {

  /**
   * إنشاء بيانات اختبار
   */
  static generateTestData(): UserData[] {
    const testUsers: UserData[] = [];

    for (let i = 1; i <= 5; i++) {
      const preferences = createDefaultPrivacyPreferences();
      preferences.allowAnalytics = Math.random() > 0.5;
      preferences.allowMarketing = Math.random() > 0.7;

      testUsers.push({
        id: `test_user_${i}`,
        email: `user${i}@test.com`,
        name: `مستخدم تجريبي ${i}`,
        phone: i % 2 === 0 ? `+96650000000${i}` : undefined,
        preferences,
        metadata: {
          createdAt: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
          lastUpdated: new Date(),
          dataRetentionDate: new Date(Date.now() + 730 * 24 * 60 * 60 * 1000) // سنتان
        }
      });
    }

    return testUsers;
  }

  /**
   * اختبار سرعة التشفير
   */
  static async benchmarkEncryption(): Promise<void> {
    console.log('⏱️ اختبار سرعة التشفير...');
    
    const testText = 'هذا نص تجريبي للاختبار '.repeat(100);
    const startTime = Date.now();

    for (let i = 0; i < 100; i++) {
      await privacyManager.encryptPersonalData(testText, PersonalDataType.SENSITIVE);
    }

    const endTime = Date.now();
    const avgTime = (endTime - startTime) / 100;

    console.log(`📊 متوسط زمن التشفير: ${avgTime.toFixed(2)} مللي ثانية`);
  }

  /**
   * اختبار شمولية التحقق
   */
  static runValidationTests(): void {
    console.log('✅ اختبار التحقق من البيانات...');

    const testCases = [
      { data: 'test@example.com', type: PersonalDataType.EMAIL, expected: true },
      { data: 'invalid-email', type: PersonalDataType.EMAIL, expected: false },
      { data: '+966501234567', type: PersonalDataType.PHONE, expected: true },
      { data: '123', type: PersonalDataType.PHONE, expected: false },
      { data: 'أحمد محمد', type: PersonalDataType.NAME, expected: true },
      { data: 'أ', type: PersonalDataType.NAME, expected: false }
    ];

    testCases.forEach(({ data, type, expected }) => {
      const result = validatePersonalData(data, type);
      const status = result === expected ? '✅' : '❌';
      console.log(`${status} ${type}: "${data}" -> ${result}`);
    });
  }
}

// تصدير جميع الأمثلة
export {
  PrivacyUsageExample as Examples,
  PrivacyScenarios as Scenarios,
  PrivacyTestHelpers as TestHelpers
};

// مثال سريع للتشغيل
if (require.main === module) {
  console.log('🎯 تشغيل أمثلة الخصوصية...\n');
  
  PrivacyUsageExample.fullWorkflowExample()
    .then(() => {
      console.log('\n🏁 انتهت الأمثلة');
    })
    .catch(console.error);
} 