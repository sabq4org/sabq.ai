/**
 * API لفحص صحة النظام
 * System Health Check API
 * @version 2.1.0
 * @author Sabq AI Team
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // فحص أساسي للنظام
    const healthChecks = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '2.1.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      services: {
        frontend: {
          status: 'healthy',
          message: 'Frontend service is running',
          responseTime: Date.now() - startTime,
        },
        api: {
          status: 'healthy', 
          message: 'API service is running',
          responseTime: Date.now() - startTime,
        },
        database: {
          status: 'unknown',
          message: 'Database connection not tested in this endpoint',
        }
      },
      checks: {
        memory: checkMemoryUsage(),
        disk: 'not_implemented',
        network: 'healthy',
      }
    };

    // إضافة معلومات الطلب
    const requestInfo = {
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || 'unknown',
    };

    const response = {
      ...healthChecks,
      request: requestInfo,
      responseTime: Date.now() - startTime,
    };

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      version: '2.1.0',
      environment: process.env.NODE_ENV || 'development',
    }, { 
      status: 500,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
  }
}

// فحص استخدام الذاكرة
function checkMemoryUsage() {
  const usage = process.memoryUsage();
  const totalMB = Math.round(usage.heapTotal / 1024 / 1024);
  const usedMB = Math.round(usage.heapUsed / 1024 / 1024);
  const percentage = Math.round((usage.heapUsed / usage.heapTotal) * 100);

  return {
    status: percentage > 90 ? 'warning' : 'healthy',
    total: `${totalMB}MB`,
    used: `${usedMB}MB`,
    percentage: `${percentage}%`,
    message: percentage > 90 ? 'High memory usage detected' : 'Memory usage is normal',
  };
}

// دعم طرق HTTP أخرى
export async function HEAD(request: NextRequest) {
  return new NextResponse(null, { status: 200 });
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Allow': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
} 