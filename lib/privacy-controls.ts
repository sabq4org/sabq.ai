/**
 * Privacy Controls Library
 * إدارة شاملة للخصوصية وحماية البيانات الشخصية
 * @version 1.0.0
 * @author Sabq AI Team
 */

import config from './config';
import { encryptText, decryptText, createHash } from './security';

/**
 * أنواع البيانات الشخصية
 */
export enum PersonalDataType {
  EMAIL = 'email',
  NAME = 'name',
  PHONE = 'phone',
  ADDRESS = 'address',
  IP_ADDRESS = 'ip_address',
  DEVICE_ID = 'device_id',
  BIOMETRIC = 'biometric',
  FINANCIAL = 'financial',
  HEALTH = 'health',
  SENSITIVE = 'sensitive'
}

/**
 * مستويات الخصوصية
 */
export enum PrivacyLevel {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted',
  TOP_SECRET = 'top_secret'
}

/**
 * أغراض معالجة البيانات
 */
export enum ProcessingPurpose {
  AUTHENTICATION = 'authentication',
  PERSONALIZATION = 'personalization',
  ANALYTICS = 'analytics',
  MARKETING = 'marketing',
  LEGAL_COMPLIANCE = 'legal_compliance',
  SECURITY = 'security',
  CUSTOMER_SUPPORT = 'customer_support'
}

/**
 * واجهة بيانات المستخدم
 */
export interface UserData {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  address?: string;
  preferences: PrivacyPreferences;
  metadata: {
    createdAt: Date;
    lastUpdated: Date;
    dataRetentionDate?: Date;
  };
}

/**
 * تفضيلات الخصوصية
 */
export interface PrivacyPreferences {
  allowAnalytics: boolean;
  allowMarketing: boolean;
  allowPersonalization: boolean;
  allowDataSharing: boolean;
  cookieConsent: boolean;
  communicationMethod: 'email' | 'sms' | 'both' | 'none';
  dataRetentionPeriod: number; // بالأيام
}

/**
 * سجل عمليات البيانات
 */
export interface DataProcessingLog {
  id: string;
  userId: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'export' | 'anonymize';
  dataType: PersonalDataType;
  purpose: ProcessingPurpose;
  timestamp: Date;
  ipAddress: string;
  userAgent?: string;
  justification?: string;
}

/**
 * فئة إدارة الخصوصية الرئيسية
 */
export class PrivacyManager {
  private static instance: PrivacyManager;
  private dataProcessingLogs: DataProcessingLog[] = [];
  
  private constructor() {}
  
  public static getInstance(): PrivacyManager {
    if (!PrivacyManager.instance) {
      PrivacyManager.instance = new PrivacyManager();
    }
    return PrivacyManager.instance;
  }

  /**
   * تحديد مستوى الخصوصية للبيانات
   */
  public classifyDataPrivacy(dataType: PersonalDataType): PrivacyLevel {
    const classification = {
      [PersonalDataType.EMAIL]: PrivacyLevel.INTERNAL,
      [PersonalDataType.NAME]: PrivacyLevel.INTERNAL,
      [PersonalDataType.PHONE]: PrivacyLevel.CONFIDENTIAL,
      [PersonalDataType.ADDRESS]: PrivacyLevel.CONFIDENTIAL,
      [PersonalDataType.IP_ADDRESS]: PrivacyLevel.INTERNAL,
      [PersonalDataType.DEVICE_ID]: PrivacyLevel.INTERNAL,
      [PersonalDataType.BIOMETRIC]: PrivacyLevel.RESTRICTED,
      [PersonalDataType.FINANCIAL]: PrivacyLevel.RESTRICTED,
      [PersonalDataType.HEALTH]: PrivacyLevel.RESTRICTED,
      [PersonalDataType.SENSITIVE]: PrivacyLevel.TOP_SECRET
    };
    
    return classification[dataType] || PrivacyLevel.CONFIDENTIAL;
  }

  /**
   * تشفير البيانات الشخصية
   */
  public async encryptPersonalData(data: any, dataType: PersonalDataType): Promise<string> {
    const privacyLevel = this.classifyDataPrivacy(dataType);
    
    // اختيار قوة التشفير بناء على مستوى الخصوصية
    const encryptionKey = this.getEncryptionKey(privacyLevel);
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    
    const result = encryptText(dataString, encryptionKey);
    return `${result.iv}:${result.authTag}:${result.encryptedData}`;
  }

  /**
   * فك تشفير البيانات الشخصية
   */
  public async decryptPersonalData(encryptedData: string, dataType: PersonalDataType): Promise<any> {
    const privacyLevel = this.classifyDataPrivacy(dataType);
    const encryptionKey = this.getEncryptionKey(privacyLevel);
    
    const [iv, authTag, encrypted] = encryptedData.split(':');
    const result = { iv, authTag, encryptedData: encrypted };
    const decryptedString = decryptText(result, encryptionKey);
    
    try {
      return JSON.parse(decryptedString);
    } catch {
      return decryptedString;
    }
  }

  /**
   * إخفاء الهوية (Anonymization)
   */
  public anonymizeData(data: UserData): any {
    const anonymized = {
      id: createHash(data.id),
      demographics: {
        ageGroup: this.getAgeGroup(data.metadata.createdAt),
        region: this.getRegionFromAddress(data.address)
      },
      preferences: data.preferences,
      metadata: {
        createdAt: this.roundToMonth(data.metadata.createdAt),
        lastUpdated: this.roundToMonth(data.metadata.lastUpdated)
      }
    };
    
    return anonymized;
  }

  /**
   * حذف البيانات الشخصية (Right to be Forgotten)
   */
  public async deletePersonalData(userId: string, dataTypes?: PersonalDataType[]): Promise<boolean> {
    try {
      await this.logDataProcessing({
        id: this.generateId(),
        userId,
        action: 'delete',
        dataType: PersonalDataType.SENSITIVE,
        purpose: ProcessingPurpose.LEGAL_COMPLIANCE,
        timestamp: new Date(),
        ipAddress: 'system',
        justification: 'User requested data deletion'
      });

      // هنا يتم تنفيذ حذف البيانات الفعلي من قاعدة البيانات
      // هذا مثال - يجب تنفيذه حسب قاعدة البيانات المستخدمة
      
      return true;
    } catch (error) {
      console.error('خطأ في حذف البيانات الشخصية:', error);
      return false;
    }
  }

  /**
   * تصدير البيانات الشخصية (Data Portability)
   */
  public async exportUserData(userId: string): Promise<any> {
    await this.logDataProcessing({
      id: this.generateId(),
      userId,
      action: 'export',
      dataType: PersonalDataType.SENSITIVE,
      purpose: ProcessingPurpose.LEGAL_COMPLIANCE,
      timestamp: new Date(),
      ipAddress: 'system',
      justification: 'User requested data export'
    });

    // هنا يتم جمع جميع بيانات المستخدم من مصادر مختلفة
    const userData = {
      personalInfo: {}, // البيانات الشخصية
      preferences: {}, // التفضيلات
      activityHistory: [], // تاريخ النشاط
      processingLogs: this.getUserProcessingLogs(userId)
    };

    return userData;
  }

  /**
   * التحقق من صحة الموافقة
   */
  public validateConsent(preferences: PrivacyPreferences, purpose: ProcessingPurpose): boolean {
    const consentMapping = {
      [ProcessingPurpose.ANALYTICS]: preferences.allowAnalytics,
      [ProcessingPurpose.MARKETING]: preferences.allowMarketing,
      [ProcessingPurpose.PERSONALIZATION]: preferences.allowPersonalization,
      [ProcessingPurpose.AUTHENTICATION]: true, // مطلوب دائماً
      [ProcessingPurpose.SECURITY]: true, // مطلوب دائماً
      [ProcessingPurpose.LEGAL_COMPLIANCE]: true, // مطلوب دائماً
      [ProcessingPurpose.CUSTOMER_SUPPORT]: true // مطلوب دائماً
    };

    return consentMapping[purpose] || false;
  }

  /**
   * فحص انتهاء صلاحية البيانات
   */
  public checkDataRetention(userData: UserData): boolean {
    if (!userData.metadata.dataRetentionDate) {
      return true; // لا يوجد حد زمني
    }

    return new Date() < userData.metadata.dataRetentionDate;
  }

  /**
   * تسجيل عملية معالجة البيانات
   */
  public async logDataProcessing(log: DataProcessingLog): Promise<void> {
    this.dataProcessingLogs.push(log);
    
    // حفظ في قاعدة البيانات
    try {
      // هنا يتم حفظ السجل في قاعدة البيانات
      console.log('تم تسجيل عملية معالجة البيانات:', log.id);
    } catch (error) {
      console.error('خطأ في تسجيل عملية البيانات:', error);
    }
  }

  /**
   * الحصول على سجلات معالجة بيانات المستخدم
   */
  public getUserProcessingLogs(userId: string): DataProcessingLog[] {
    return this.dataProcessingLogs.filter(log => log.userId === userId);
  }

  /**
   * تطبيق سياسة الاحتفاظ بالبيانات
   */
  public async applyRetentionPolicy(): Promise<void> {
    const expiredUsers = await this.findExpiredDataUsers();
    
    for (const userId of expiredUsers) {
      await this.deletePersonalData(userId);
    }
  }

  // وظائف مساعدة خاصة
  private getEncryptionKey(privacyLevel: PrivacyLevel): string {
    // استخدام مفاتيح تشفير مختلفة حسب مستوى الخصوصية
    const baseKey = config.auth.jwtSecret; // نستخدم JWT secret كأساس
    const keys = {
      [PrivacyLevel.PUBLIC]: baseKey + 'public',
      [PrivacyLevel.INTERNAL]: baseKey + 'internal', 
      [PrivacyLevel.CONFIDENTIAL]: baseKey + 'confidential',
      [PrivacyLevel.RESTRICTED]: baseKey + 'restricted',
      [PrivacyLevel.TOP_SECRET]: baseKey + 'topsecret'
    };
    
    const key = keys[privacyLevel] || baseKey;
    // تحويل إلى hex 32 byte key
    return createHash(key).substring(0, 64);
  }

  private getAgeGroup(createdAt: Date): string {
    const accountAge = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 365));
    
    if (accountAge < 1) return 'جديد';
    if (accountAge < 3) return 'متوسط';
    return 'قديم';
  }

  private getRegionFromAddress(address?: string): string {
    if (!address) return 'غير محدد';
    
    // هنا يمكن تطبيق منطق أكثر تعقيداً لتحديد المنطقة
    const regions = ['الرياض', 'جدة', 'الدمام', 'المدينة', 'مكة'];
    
    for (const region of regions) {
      if (address.includes(region)) {
        return region;
      }
    }
    
    return 'أخرى';
  }

  private roundToMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private async findExpiredDataUsers(): Promise<string[]> {
    // هنا يتم البحث في قاعدة البيانات عن المستخدمين الذين انتهت صلاحية بياناتهم
    return [];
  }
}

/**
 * مصنع إنشاء تفضيلات خصوصية افتراضية
 */
export function createDefaultPrivacyPreferences(): PrivacyPreferences {
  return {
    allowAnalytics: false,
    allowMarketing: false,
    allowPersonalization: true,
    allowDataSharing: false,
    cookieConsent: false,
    communicationMethod: 'email',
    dataRetentionPeriod: 365 * 2 // سنتان
  };
}

/**
 * التحقق من صحة البيانات الشخصية
 */
export function validatePersonalData(data: any, dataType: PersonalDataType): boolean {
  const validators = {
    [PersonalDataType.EMAIL]: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    [PersonalDataType.PHONE]: (phone: string) => /^[\+]?[\d\s\-\(\)]+$/.test(phone),
    [PersonalDataType.NAME]: (name: string) => name && name.length >= 2,
    [PersonalDataType.ADDRESS]: (address: string) => address && address.length >= 10,
    [PersonalDataType.IP_ADDRESS]: (ip: string) => /^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(ip),
    [PersonalDataType.DEVICE_ID]: (id: string) => id && id.length >= 10,
    [PersonalDataType.BIOMETRIC]: (bio: string) => bio && bio.length >= 20,
    [PersonalDataType.FINANCIAL]: (fin: string) => fin && fin.length >= 10,
    [PersonalDataType.HEALTH]: (health: string) => health && health.length >= 5,
    [PersonalDataType.SENSITIVE]: (sens: string) => sens && sens.length >= 1
  };

  const validator = validators[dataType];
  return validator ? validator(data) : true;
}

/**
 * تنظيف البيانات الشخصية من السلاسل النصية
 */
export function sanitizePersonalData(text: string): string {
  // إزالة عناوين البريد الإلكتروني
  text = text.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REMOVED]');
  
  // إزالة أرقام الهواتف
  text = text.replace(/[\+]?[\d\s\-\(\)]{10,}/g, '[PHONE_REMOVED]');
  
  // إزالة أرقام الهوية
  text = text.replace(/\b\d{10}\b/g, '[ID_REMOVED]');
  
  return text;
}

// تصدير instance وحيد من Privacy Manager
export const privacyManager = PrivacyManager.getInstance(); 