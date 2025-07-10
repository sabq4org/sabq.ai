// اختبارات شاملة لنظام الأمان
// يتضمن اختبارات التشفير، المصادقة، وحماية البيانات

import {
  hashPassword,
  verifyPassword,
  generateSecurePassword,
  generateVerificationCode,
  generateSecureToken,
  encryptText,
  decryptText,
  createHash,
  createHMAC,
  verifyHMAC,
  createSimpleJWT,
  verifySimpleJWT,
  generateSessionId,
  encryptUserId,
  decryptUserId,
  evaluatePasswordStrength,
  EncryptionResult,
  JWTPayload,
  PasswordStrength,
} from '../../lib/security';

describe('Security Tests - اختبارات الأمان', () => {
  
  describe('Password Hashing - تشفير كلمات المرور', () => {
    test('يجب أن يشفر كلمة المرور بنجاح', async () => {
      const password = 'testPassword123!';
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      expect(hashedPassword.length).toBeGreaterThan(50);
      expect(hashedPassword.startsWith('$2b$')).toBe(true);
    });

    test('يجب أن يستخدم saltRounds مخصص', async () => {
      const password = 'testPassword123!';
      const customRounds = 10;
      const hashedPassword = await hashPassword(password, customRounds);
      
      expect(hashedPassword).toContain(`$2b$${customRounds}$`);
    });

    test('يجب أن يرفض كلمة مرور فارغة', async () => {
      await expect(hashPassword('')).rejects.toThrow('كلمة المرور مطلوبة');
    });

    test('يجب أن يرفض كلمة مرور قصيرة', async () => {
      await expect(hashPassword('123')).rejects.toThrow('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
    });

    test('يجب أن يتحقق من كلمة مرور صحيحة', async () => {
      const password = 'testPassword123!';
      const hashedPassword = await hashPassword(password);
      
      const isValid = await verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });

    test('يجب أن يرفض كلمة مرور خاطئة', async () => {
      const password = 'testPassword123!';
      const wrongPassword = 'wrongPassword123!';
      const hashedPassword = await hashPassword(password);
      
      const isValid = await verifyPassword(wrongPassword, hashedPassword);
      expect(isValid).toBe(false);
    });

    test('يجب أن يتعامل مع القيم الفارغة في التحقق', async () => {
      const result1 = await verifyPassword('', 'hash');
      const result2 = await verifyPassword('password', '');
      const result3 = await verifyPassword('', '');
      
      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(false);
    });
  });

  describe('Secure Generation - التوليد الآمن', () => {
    test('يجب أن يولد كلمة مرور قوية', () => {
      const password = generateSecurePassword();
      
      expect(password).toBeDefined();
      expect(password.length).toBe(16);
      expect(/[a-z]/.test(password)).toBe(true); // أحرف صغيرة
      expect(/[A-Z]/.test(password)).toBe(true); // أحرف كبيرة
      expect(/[0-9]/.test(password)).toBe(true); // أرقام
      expect(/[^a-zA-Z0-9]/.test(password)).toBe(true); // أحرف خاصة
    });

    test('يجب أن يولد كلمة مرور بطول مخصص', () => {
      const length = 24;
      const password = generateSecurePassword(length);
      
      expect(password.length).toBe(length);
    });

    test('يجب أن يولد كلمة مرور بدون أحرف خاصة', () => {
      const password = generateSecurePassword(16, false);
      
      expect(password.length).toBe(16);
      expect(/[^a-zA-Z0-9]/.test(password)).toBe(false);
    });

    test('يجب أن يولد رمز تحقق رقمي', () => {
      const code = generateVerificationCode();
      
      expect(code).toBeDefined();
      expect(code.length).toBe(6);
      expect(/^\d+$/.test(code)).toBe(true);
    });

    test('يجب أن يولد رمز تحقق بطول مخصص', () => {
      const length = 8;
      const code = generateVerificationCode(length);
      
      expect(code.length).toBe(length);
      expect(/^\d+$/.test(code)).toBe(true);
    });

    test('يجب أن يولد رمز آمن للجلسات', () => {
      const token = generateSecureToken();
      
      expect(token).toBeDefined();
      expect(token.length).toBe(64); // 32 bytes = 64 hex chars
      expect(/^[a-f0-9]+$/.test(token)).toBe(true);
    });

    test('يجب أن يولد رمز آمن بطول مخصص', () => {
      const length = 16;
      const token = generateSecureToken(length);
      
      expect(token.length).toBe(length * 2); // hex encoding
    });

    test('يجب أن يولد رموز مختلفة في كل مرة', () => {
      const token1 = generateSecureToken();
      const token2 = generateSecureToken();
      const password1 = generateSecurePassword();
      const password2 = generateSecurePassword();
      
      expect(token1).not.toBe(token2);
      expect(password1).not.toBe(password2);
    });
  });

  describe('Text Encryption - تشفير النصوص', () => {
    const testKey = 'a'.repeat(64); // 32 bytes key في hex
    const testText = 'هذا نص تجريبي للتشفير والحماية';

    test('يجب أن يشفر النص بنجاح', () => {
      const result = encryptText(testText, testKey);
      
      expect(result).toBeDefined();
      expect(result.encryptedData).toBeDefined();
      expect(result.iv).toBeDefined();
      expect(result.authTag).toBeDefined();
      expect(result.encryptedData).not.toBe(testText);
    });

    test('يجب أن يفك تشفير النص بنجاح', () => {
      const encrypted = encryptText(testText, testKey);
      const decrypted = decryptText(encrypted, testKey);
      
      expect(decrypted).toBe(testText);
    });

    test('يجب أن يرفض نص فارغ للتشفير', () => {
      expect(() => encryptText('', testKey)).toThrow('النص مطلوب للتشفير');
    });

    test('يجب أن يرفض مفتاح غير صحيح للتشفير', () => {
      expect(() => encryptText(testText, 'short')).toThrow('مفتاح التشفير يجب أن يكون 64 حرف hex');
    });

    test('يجب أن يرفض بيانات تشفير ناقصة لفك التشفير', () => {
      const incompleteResult: EncryptionResult = {
        encryptedData: 'test',
        iv: '',
        authTag: 'test'
      };
      
      expect(() => decryptText(incompleteResult, testKey)).toThrow('بيانات التشفير غير مكتملة');
    });

    test('يجب أن يرفض مفتاح خاطئ لفك التشفير', () => {
      const encrypted = encryptText(testText, testKey);
      const wrongKey = 'b'.repeat(64);
      
      expect(() => decryptText(encrypted, wrongKey)).toThrow('فشل في فك التشفير');
    });

    test('يجب أن ينتج نتائج مختلفة لنفس النص', () => {
      const result1 = encryptText(testText, testKey);
      const result2 = encryptText(testText, testKey);
      
      expect(result1.encryptedData).not.toBe(result2.encryptedData);
      expect(result1.iv).not.toBe(result2.iv);
    });
  });

  describe('Hash and HMAC - الهاش و HMAC', () => {
    const testText = 'نص تجريبي للهاش';
    const testKey = 'مفتاح-سري-للاختبار';

    test('يجب أن ينشئ hash صحيح', () => {
      const hash = createHash(testText);
      
      expect(hash).toBeDefined();
      expect(hash.length).toBe(64); // SHA256 = 64 hex chars
      expect(/^[a-f0-9]+$/.test(hash)).toBe(true);
    });

    test('يجب أن ينشئ نفس الهاش لنفس النص', () => {
      const hash1 = createHash(testText);
      const hash2 = createHash(testText);
      
      expect(hash1).toBe(hash2);
    });

    test('يجب أن يدعم خوارزميات مختلفة', () => {
      const sha256 = createHash(testText, 'sha256');
      const sha384 = createHash(testText, 'sha384');
      const sha512 = createHash(testText, 'sha512');
      
      expect(sha256.length).toBe(64);
      expect(sha384.length).toBe(96);
      expect(sha512.length).toBe(128);
    });

    test('يجب أن يرفض نص فارغ للهاش', () => {
      expect(() => createHash('')).toThrow('النص مطلوب لإنشاء الهاش');
    });

    test('يجب أن ينشئ HMAC صحيح', () => {
      const hmac = createHMAC(testText, testKey);
      
      expect(hmac).toBeDefined();
      expect(hmac.length).toBe(64);
      expect(/^[a-f0-9]+$/.test(hmac)).toBe(true);
    });

    test('يجب أن يتحقق من HMAC صحيح', () => {
      const hmac = createHMAC(testText, testKey);
      const isValid = verifyHMAC(testText, testKey, hmac);
      
      expect(isValid).toBe(true);
    });

    test('يجب أن يرفض HMAC خاطئ', () => {
      const hmac = createHMAC(testText, testKey);
      const isValid = verifyHMAC(testText + 'modified', testKey, hmac);
      
      expect(isValid).toBe(false);
    });

    test('يجب أن يرفض مفتاح خاطئ في HMAC', () => {
      const hmac = createHMAC(testText, testKey);
      const isValid = verifyHMAC(testText, testKey + 'wrong', hmac);
      
      expect(isValid).toBe(false);
    });

    test('يجب أن يرفض قيم فارغة في HMAC', () => {
      expect(() => createHMAC('', testKey)).toThrow('النص والمفتاح مطلوبان لإنشاء HMAC');
      expect(() => createHMAC(testText, '')).toThrow('النص والمفتاح مطلوبان لإنشاء HMAC');
    });

    test('يجب أن يتعامل مع أخطاء التحقق من HMAC', () => {
      const isValid = verifyHMAC(testText, testKey, 'invalid-hmac');
      expect(isValid).toBe(false);
    });
  });

  describe('Simple JWT - JWT بسيط', () => {
    const secret = 'jwt-secret-key-for-testing';
    const payload: JWTPayload = { userId: '123', role: 'user' };

    test('يجب أن ينشئ JWT صحيح', () => {
      const jwt = createSimpleJWT(payload, secret);
      
      expect(jwt).toBeDefined();
      expect(jwt.split('.').length).toBe(3);
    });

    test('يجب أن يتحقق من JWT صحيح', () => {
      const jwt = createSimpleJWT(payload, secret);
      const decoded = verifySimpleJWT(jwt, secret);
      
      expect(decoded).toBeDefined();
      expect(decoded!.userId).toBe(payload.userId);
      expect(decoded!.role).toBe(payload.role);
      expect(decoded!.iat).toBeDefined();
    });

    test('يجب أن ينشئ JWT مع انتهاء صلاحية', () => {
      const expiresIn = 3600; // 1 hour
      const jwt = createSimpleJWT(payload, secret, expiresIn);
      const decoded = verifySimpleJWT(jwt, secret);
      
      expect(decoded).toBeDefined();
      expect(decoded!.exp).toBeDefined();
      expect(decoded!.exp).toBeGreaterThan(decoded!.iat!);
    });

    test('يجب أن يرفض JWT منتهي الصلاحية', () => {
      const expiresIn = -1; // منتهي الصلاحية
      const jwt = createSimpleJWT(payload, secret, expiresIn);
      const decoded = verifySimpleJWT(jwt, secret);
      
      expect(decoded).toBeNull();
    });

    test('يجب أن يرفض JWT بمفتاح خاطئ', () => {
      const jwt = createSimpleJWT(payload, secret);
      const decoded = verifySimpleJWT(jwt, secret + 'wrong');
      
      expect(decoded).toBeNull();
    });

    test('يجب أن يرفض JWT معطوب', () => {
      const decoded1 = verifySimpleJWT('invalid.jwt.token', secret);
      const decoded2 = verifySimpleJWT('invalid', secret);
      const decoded3 = verifySimpleJWT('', secret);
      
      expect(decoded1).toBeNull();
      expect(decoded2).toBeNull();
      expect(decoded3).toBeNull();
    });
  });

  describe('Session Management - إدارة الجلسات', () => {
    const secret = 'session-secret-key';
    const userId = 'user123';

    test('يجب أن يولد معرف جلسة آمن', () => {
      const sessionId = generateSessionId();
      
      expect(sessionId).toBeDefined();
      expect(sessionId.length).toBe(64);
      expect(/^[a-f0-9]+$/.test(sessionId)).toBe(true);
    });

    test('يجب أن يولد معرفات جلسة مختلفة', () => {
      const id1 = generateSessionId();
      const id2 = generateSessionId();
      
      expect(id1).not.toBe(id2);
    });

    test('يجب أن يشفر معرف المستخدم', () => {
      const encrypted = encryptUserId(userId, secret);
      
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(userId);
      expect(encrypted.split('.').length).toBe(3);
    });

    test('يجب أن يفك تشفير معرف المستخدم', () => {
      const encrypted = encryptUserId(userId, secret);
      const decrypted = decryptUserId(encrypted, secret);
      
      expect(decrypted).toBe(userId);
    });

    test('يجب أن يرفض معرف مستخدم معطوب', () => {
      const result1 = decryptUserId('invalid.encrypted.data', secret);
      const result2 = decryptUserId('invalid', secret);
      const result3 = decryptUserId('', secret);
      
      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(result3).toBeNull();
    });

    test('يجب أن يرفض مفتاح خاطئ لفك تشفير المعرف', () => {
      const encrypted = encryptUserId(userId, secret);
      const decrypted = decryptUserId(encrypted, secret + 'wrong');
      
      expect(decrypted).toBeNull();
    });
  });

  describe('Password Strength Evaluation - تقييم قوة كلمة المرور', () => {
    test('يجب أن يقيم كلمة مرور قوية', () => {
      const strongPassword = 'MyStr0ng!P@ssw0rd2024';
      const result = evaluatePasswordStrength(strongPassword);
      
      expect(result.score).toBeGreaterThan(70);
      expect(['قوي', 'قوي جداً']).toContain(result.level);
      if (result.score >= 80) {
        expect(result.feedback).toContain('كلمة مرور ممتازة!');
      }
    });

    test('يجب أن يقيم كلمة مرور ضعيفة', () => {
      const weakPassword = '123456';
      const result = evaluatePasswordStrength(weakPassword);
      
      expect(result.score).toBeLessThan(40);
      expect(result.level).toBe('ضعيف');
      expect(result.feedback.length).toBeGreaterThan(0);
    });

    test('يجب أن يكتشف الأنماط الشائعة', () => {
      const commonPasswords = ['password', 'qwerty', '123456', 'abc123'];
      
      commonPasswords.forEach(pwd => {
        const result = evaluatePasswordStrength(pwd);
        expect(result.feedback).toContain('تجنب الأنماط الشائعة والتسلسلات');
      });
    });

    test('يجب أن يكتشف كلمة مرور قصيرة', () => {
      const shortPassword = 'Ab1!';
      const result = evaluatePasswordStrength(shortPassword);
      
      expect(result.feedback).toContain('كلمة المرور قصيرة جداً (أقل من 8 أحرف)');
    });

    test('يجب أن يكتشف نقص الأحرف المختلفة', () => {
      const testCases = [
        { password: 'alllowercase', feedback: 'أضف أحرف كبيرة (A-Z)' },
        { password: 'ALLUPPERCASE', feedback: 'أضف أحرف صغيرة (a-z)' },
        { password: 'NoNumbers!', feedback: 'أضف أرقام (0-9)' },
        { password: 'NoSpecial123', feedback: 'أضف أحرف خاصة (!@#$%^&*)' },
      ];

      testCases.forEach(({ password, feedback }) => {
        const result = evaluatePasswordStrength(password);
        expect(result.feedback).toContain(feedback);
      });
    });

    test('يجب أن يكتشف تكرار الأحرف', () => {
      const repetitivePassword = 'aaaaaaaaA1!';
      const result = evaluatePasswordStrength(repetitivePassword);
      
      expect(result.feedback).toContain('تجنب تكرار الأحرف كثيراً');
    });

    test('يجب أن يعطي نقاط إضافية للطول', () => {
      const shortPassword = 'Abcd123!';
      const longPassword = 'VeryLongPasswordWithManyCharacters123!@#';
      
      const shortResult = evaluatePasswordStrength(shortPassword);
      const longResult = evaluatePasswordStrength(longPassword);
      
      expect(longResult.score).toBeGreaterThan(shortResult.score);
    });

    test('يجب أن يحدد المستويات بشكل صحيح', () => {
      const passwords = [
        { password: '123', expectedLevel: 'ضعيف' },
        { password: 'Password1', expectedLevel: 'متوسط' },
        { password: 'GoodPass123!', expectedMinScore: 60 },
        { password: 'ExcellentP@ssw0rd2024!', expectedMinScore: 75 },
      ];

      passwords.forEach(({ password, expectedLevel, expectedMinScore }) => {
        const result = evaluatePasswordStrength(password);
        if (expectedLevel) {
          expect(result.level).toBe(expectedLevel);
        }
        if (expectedMinScore) {
          expect(result.score).toBeGreaterThanOrEqual(expectedMinScore);
        }
      });
    });
  });

  describe('Edge Cases and Error Handling - الحالات الحدية ومعالجة الأخطاء', () => {
    test('يجب أن يتعامل مع النصوص العربية', async () => {
      const arabicPassword = 'كلمة-سر-عربية123!';
      const hashedPassword = await hashPassword(arabicPassword);
      const isValid = await verifyPassword(arabicPassword, hashedPassword);
      
      expect(isValid).toBe(true);
    });

    test('يجب أن يتعامل مع الرموز الخاصة', () => {
      const specialText = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = createHash(specialText);
      
      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);
    });

    test('يجب أن يتعامل مع النصوص الطويلة', () => {
      const longText = 'A'.repeat(10000);
      const hash = createHash(longText);
      const encrypted = encryptText(longText, 'a'.repeat(64));
      
      expect(hash).toBeDefined();
      expect(encrypted.encryptedData).toBeDefined();
    });

    test('يجب أن يتعامل مع المفاتيح في حدود الطول', () => {
      const text = 'test';
      const validKey = 'a'.repeat(64);
      const shortKey = 'a'.repeat(63);
      const longKey = 'a'.repeat(65);
      
      expect(() => encryptText(text, validKey)).not.toThrow();
      expect(() => encryptText(text, shortKey)).toThrow();
      expect(() => encryptText(text, longKey)).toThrow();
    });
  });
}); 