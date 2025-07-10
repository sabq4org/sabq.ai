/**
 * اختبارات صحة النظام
 * System Health Tests
 */

import { describe, it, expect } from '@jest/globals';

describe('🏥 فحص صحة النظام', () => {
  it('should return healthy status', async () => {
    const response = await fetch('http://localhost:3000/api/health');
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.version).toBeDefined();
  });

  it('should load homepage', async () => {
    const response = await fetch('http://localhost:3000');
    expect(response.status).toBe(200);
  });
});

describe('📝 اختبار المقالات', () => {
  it('should fetch articles', async () => {
    const response = await fetch('http://localhost:3000/api/articles');
    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(500);
  });
});

describe('🔐 اختبار المصادقة', () => {
  it('should handle login attempts', async () => {
    const response = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'test123' })
    });
    
    expect(response.status).toBeGreaterThanOrEqual(200);
    expect(response.status).toBeLessThan(500);
  });
}); 