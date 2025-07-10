/**
 * API Routes for Integration Testing
 * 
 * @description Tests integration connectivity and configuration
 * @author Sabq AI CMS Team
 * @version 1.0.0
 * @created 2024-01-15
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { logAuditEvent } from '@/lib/audit-logger';
import { validateUserPermissions } from '@/lib/permissions';
import { decrypt } from '@/lib/encryption';

// Validation schemas
const paramsSchema = z.object({
  id: z.string().uuid('معرف التكامل غير صحيح'),
});

const testRequestSchema = z.object({
  testType: z.enum(['CONNECTION', 'AUTHENTICATION', 'FULL']).default('CONNECTION'),
  customEndpoint: z.string().url().optional(),
  timeout: z.number().positive().max(30000).default(10000),
});

/**
 * Test functions for different integration types
 */
class IntegrationTester {
  private static async testCDNIntegration(config: any, testType: string) {
    const results = {
      connection: false,
      authentication: false,
      upload: false,
      download: false,
      errors: [] as string[],
    };

    try {
      // Test basic connectivity
      const response = await fetch(config.endpoint || config.baseUrl, {
        method: 'HEAD',
        timeout: 10000,
      });

      results.connection = response.ok;
      
      if (!response.ok) {
        results.errors.push(`Connection failed: ${response.status} ${response.statusText}`);
      }

      // Test authentication if required
      if (testType !== 'CONNECTION' && config.apiKey) {
        const authResponse = await fetch(`${config.endpoint}/test`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        });

        results.authentication = authResponse.ok;
        
        if (!authResponse.ok) {
          results.errors.push(`Authentication failed: ${authResponse.status}`);
        }
      }

      // Full test includes upload/download test
      if (testType === 'FULL') {
        // Test upload capability
        const testData = new Blob(['test content'], { type: 'text/plain' });
        const formData = new FormData();
        formData.append('file', testData, 'test.txt');

        const uploadResponse = await fetch(`${config.endpoint}/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
          },
          body: formData,
          timeout: 15000,
        });

        results.upload = uploadResponse.ok;
        
        if (!uploadResponse.ok) {
          results.errors.push(`Upload test failed: ${uploadResponse.status}`);
        }
      }

    } catch (error) {
      results.errors.push(`Test error: ${error.message}`);
    }

    return results;
  }

  private static async testAnalyticsIntegration(config: any, testType: string) {
    const results = {
      connection: false,
      authentication: false,
      apiAccess: false,
      errors: [] as string[],
    };

    try {
      // Test API endpoint
      const response = await fetch(`${config.endpoint}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      results.connection = response.ok;
      results.authentication = response.ok;

      if (!response.ok) {
        results.errors.push(`API test failed: ${response.status} ${response.statusText}`);
      }

      // Test API access with sample query
      if (testType === 'FULL' && response.ok) {
        const testQuery = await fetch(`${config.endpoint}/test-query`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            query: 'SELECT 1',
            test: true,
          }),
          timeout: 15000,
        });

        results.apiAccess = testQuery.ok;
        
        if (!testQuery.ok) {
          results.errors.push(`API access test failed: ${testQuery.status}`);
        }
      }

    } catch (error) {
      results.errors.push(`Analytics test error: ${error.message}`);
    }

    return results;
  }

  private static async testPaymentIntegration(config: any, testType: string) {
    const results = {
      connection: false,
      authentication: false,
      webhook: false,
      errors: [] as string[],
    };

    try {
      // Test API connectivity
      const response = await fetch(`${config.endpoint}/health`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.secretKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      results.connection = response.ok;
      results.authentication = response.ok;

      if (!response.ok) {
        results.errors.push(`Payment API test failed: ${response.status}`);
      }

      // Test webhook endpoint if configured
      if (testType === 'FULL' && config.webhookUrl) {
        const webhookTest = await fetch(config.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            test: true,
            timestamp: new Date().toISOString(),
          }),
          timeout: 10000,
        });

        results.webhook = webhookTest.ok;
        
        if (!webhookTest.ok) {
          results.errors.push(`Webhook test failed: ${webhookTest.status}`);
        }
      }

    } catch (error) {
      results.errors.push(`Payment test error: ${error.message}`);
    }

    return results;
  }

  private static async testEmailIntegration(config: any, testType: string) {
    const results = {
      connection: false,
      authentication: false,
      sendTest: false,
      errors: [] as string[],
    };

    try {
      // Test SMTP or API connectivity
      if (config.smtpHost) {
        // SMTP test
        const { createTransport } = require('nodemailer');
        const transporter = createTransport({
          host: config.smtpHost,
          port: config.smtpPort,
          secure: config.smtpSecure,
          auth: {
            user: config.smtpUser,
            pass: config.smtpPassword,
          },
        });

        const verified = await transporter.verify();
        results.connection = verified;
        results.authentication = verified;

        if (!verified) {
          results.errors.push('SMTP connection/authentication failed');
        }

        // Test sending email
        if (testType === 'FULL' && verified) {
          const testEmail = await transporter.sendMail({
            from: config.fromEmail,
            to: config.testEmail || 'test@example.com',
            subject: 'Test Email from Sabq CMS',
            text: 'This is a test email to verify email integration.',
          });

          results.sendTest = !!testEmail.messageId;
          
          if (!testEmail.messageId) {
            results.errors.push('Failed to send test email');
          }
        }
      } else {
        // API-based email service test
        const response = await fetch(`${config.endpoint}/send`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            test: true,
            to: config.testEmail || 'test@example.com',
            subject: 'Test Email',
            text: 'This is a test email.',
          }),
          timeout: 10000,
        });

        results.connection = response.ok;
        results.authentication = response.ok;
        results.sendTest = response.ok;

        if (!response.ok) {
          results.errors.push(`Email API test failed: ${response.status}`);
        }
      }

    } catch (error) {
      results.errors.push(`Email test error: ${error.message}`);
    }

    return results;
  }

  private static async testSocialIntegration(config: any, testType: string) {
    const results = {
      connection: false,
      authentication: false,
      apiAccess: false,
      errors: [] as string[],
    };

    try {
      // Test API connectivity
      const response = await fetch(`${config.endpoint}/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      });

      results.connection = response.ok;
      results.authentication = response.ok;

      if (!response.ok) {
        results.errors.push(`Social API test failed: ${response.status}`);
      }

      // Test API access with sample query
      if (testType === 'FULL' && response.ok) {
        const testPost = await fetch(`${config.endpoint}/test-post`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: 'Test post from Sabq CMS',
            test: true,
          }),
          timeout: 15000,
        });

        results.apiAccess = testPost.ok;
        
        if (!testPost.ok) {
          results.errors.push(`Social API access test failed: ${testPost.status}`);
        }
      }

    } catch (error) {
      results.errors.push(`Social test error: ${error.message}`);
    }

    return results;
  }

  private static async testStorageIntegration(config: any, testType: string) {
    const results = {
      connection: false,
      authentication: false,
      upload: false,
      download: false,
      errors: [] as string[],
    };

    try {
      // Test bucket/container access
      const response = await fetch(`${config.endpoint}/${config.bucket}`, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
        },
        timeout: 10000,
      });

      results.connection = response.ok;
      results.authentication = response.ok;

      if (!response.ok) {
        results.errors.push(`Storage access test failed: ${response.status}`);
      }

      // Test upload/download
      if (testType === 'FULL' && response.ok) {
        const testData = new Blob(['test content'], { type: 'text/plain' });
        const uploadResponse = await fetch(`${config.endpoint}/${config.bucket}/test-file.txt`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
            'Content-Type': 'text/plain',
          },
          body: testData,
          timeout: 15000,
        });

        results.upload = uploadResponse.ok;
        
        if (!uploadResponse.ok) {
          results.errors.push(`Storage upload test failed: ${uploadResponse.status}`);
        }

        // Test download
        const downloadResponse = await fetch(`${config.endpoint}/${config.bucket}/test-file.txt`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
          },
          timeout: 10000,
        });

        results.download = downloadResponse.ok;
        
        if (!downloadResponse.ok) {
          results.errors.push(`Storage download test failed: ${downloadResponse.status}`);
        }

        // Cleanup test file
        if (uploadResponse.ok) {
          await fetch(`${config.endpoint}/${config.bucket}/test-file.txt`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${config.accessToken}`,
            },
          });
        }
      }

    } catch (error) {
      results.errors.push(`Storage test error: ${error.message}`);
    }

    return results;
  }

  public static async testIntegration(type: string, config: any, testType: string) {
    switch (type) {
      case 'CDN':
        return this.testCDNIntegration(config, testType);
      case 'ANALYTICS':
        return this.testAnalyticsIntegration(config, testType);
      case 'PAYMENT':
        return this.testPaymentIntegration(config, testType);
      case 'EMAIL':
        return this.testEmailIntegration(config, testType);
      case 'SOCIAL':
        return this.testSocialIntegration(config, testType);
      case 'STORAGE':
        return this.testStorageIntegration(config, testType);
      default:
        throw new Error(`Unsupported integration type: ${type}`);
    }
  }
}

/**
 * POST /api/integrations/[id]/test
 * Tests integration connectivity and functionality
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'غير مصرح بالوصول' },
        { status: 401 }
      );
    }

    // Permission check
    const hasPermission = await validateUserPermissions(
      session.user.id,
      'integrations',
      'test'
    );
    if (!hasPermission) {
      return NextResponse.json(
        { error: 'لا تملك صلاحية لاختبار التكاملات' },
        { status: 403 }
      );
    }

    // Validate params
    const validatedParams = paramsSchema.parse(params);
    
    // Parse request body
    const body = await request.json();
    const validatedData = testRequestSchema.parse(body);

    // Get integration
    const integration = await prisma.integration.findUnique({
      where: { id: validatedParams.id },
    });
    
    if (!integration) {
      return NextResponse.json(
        { error: 'التكامل غير موجود' },
        { status: 404 }
      );
    }

    if (!integration.isActive) {
      return NextResponse.json(
        { error: 'التكامل غير نشط' },
        { status: 400 }
      );
    }

    // Decrypt configuration
    const decryptedConfig = { ...integration.configuration };
    
    if (decryptedConfig.apiKey) {
      decryptedConfig.apiKey = await decrypt(decryptedConfig.apiKey);
    }
    if (decryptedConfig.secretKey) {
      decryptedConfig.secretKey = await decrypt(decryptedConfig.secretKey);
    }
    if (decryptedConfig.accessToken) {
      decryptedConfig.accessToken = await decrypt(decryptedConfig.accessToken);
    }

    // Run integration test
    const startTime = Date.now();
    const testResults = await IntegrationTester.testIntegration(
      integration.type,
      decryptedConfig,
      validatedData.testType
    );
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Determine overall success
    const success = testResults.connection && 
                   (validatedData.testType === 'CONNECTION' || testResults.authentication);

    // Update integration test results
    await prisma.integration.update({
      where: { id: validatedParams.id },
      data: {
        lastTestedAt: new Date(),
        testResults: testResults,
        isHealthy: success,
        updatedAt: new Date(),
      },
    });

    // Log audit event
    await logAuditEvent({
      userId: session.user.id,
      action: 'TEST_INTEGRATION',
      resource: 'integrations',
      resourceId: integration.id,
      metadata: {
        integrationName: integration.name,
        provider: integration.provider,
        testType: validatedData.testType,
        success,
        duration,
        results: testResults,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        integrationId: integration.id,
        integrationName: integration.name,
        provider: integration.provider,
        type: integration.type,
        testType: validatedData.testType,
        testResults,
        duration,
        testedAt: new Date().toISOString(),
      },
      message: success ? 'تم اختبار التكامل بنجاح' : 'فشل اختبار التكامل',
    });

  } catch (error) {
    console.error('Error testing integration:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'بيانات غير صحيحة',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    // Log error
    await logAuditEvent({
      userId: session?.user?.id || 'unknown',
      action: 'TEST_INTEGRATION_ERROR',
      resource: 'integrations',
      resourceId: params.id,
      metadata: {
        error: error.message,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json(
      { 
        error: 'خطأ في اختبار التكامل',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
} 