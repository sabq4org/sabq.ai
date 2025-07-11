/**
 * API Routes for Search Functionality
 * 
 * @description Provides advanced search capabilities with Arabic language support
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
import { rateLimiter } from '@/lib/rate-limiter';
import { getClientIP } from '@/lib/device-detection';
import { normalizeArabicText } from '@/lib/arabic-utils';
import { searchEngine } from '@/lib/search-engine';

// Validation schemas
const searchQuerySchema = z.object({
  query: z.string().min(1, 'نص البحث مطلوب').max(500, 'نص البحث طويل جداً'),
  type: z.enum(['articles', 'users', 'sections', 'tags', 'all']).default('all'),
  filters: z.object({
    sectionId: z.string().uuid().optional(),
    authorId: z.string().uuid().optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED', 'ARCHIVED']).optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
    language: z.enum(['ar', 'en', 'fr']).optional(),
    contentType: z.enum(['article', 'video', 'image', 'audio', 'document']).optional(),
    readingTime: z.object({
      min: z.number().min(0).optional(),
      max: z.number().min(0).optional(),
    }).optional(),
  }).optional(),
  sort: z.object({
    field: z.enum(['relevance', 'date', 'views', 'likes', 'comments', 'title']).default('relevance'),
    order: z.enum(['asc', 'desc']).default('desc'),
  }).optional(),
  pagination: z.object({
    page: z.number().min(1).default(1),
    limit: z.number().min(1).max(100).default(10),
  }).optional(),
  includeHighlights: z.boolean().default(true),
  includeFacets: z.boolean().default(false),
  searchMode: z.enum(['simple', 'advanced', 'semantic']).default('simple'),
});

const autoCompleteSchema = z.object({
  query: z.string().min(1, 'نص البحث مطلوب').max(100, 'نص البحث طويل جداً'),
  type: z.enum(['articles', 'users', 'sections', 'tags', 'all']).default('all'),
  limit: z.number().min(1).max(20).default(10),
});

const searchSuggestionsSchema = z.object({
  query: z.string().min(1, 'نص البحث مطلوب').max(100, 'نص البحث طويل جداً'),
  limit: z.number().min(1).max(10).default(5),
});

/**
 * Helper function to build search query
 */
function buildSearchQuery(searchParams: z.infer<typeof searchQuerySchema>) {
  const { query, type, filters, sort, pagination } = searchParams;
  
  // Normalize Arabic text
  const normalizedQuery = normalizeArabicText(query);
  
  // Build base query
  const baseQuery = {
    where: {
      OR: [
        { title: { contains: normalizedQuery, mode: 'insensitive' } },
        { content: { contains: normalizedQuery, mode: 'insensitive' } },
        { excerpt: { contains: normalizedQuery, mode: 'insensitive' } },
        { keywords: { hasSome: normalizedQuery.split(' ') } },
        { tags: { some: { name: { contains: normalizedQuery, mode: 'insensitive' } } } },
      ],
    },
    orderBy: [],
    skip: ((pagination?.page || 1) - 1) * (pagination?.limit || 10),
    take: pagination?.limit || 10,
  };

  // Apply filters
  if (filters) {
    const additionalFilters = [];

    if (filters.sectionId) {
      additionalFilters.push({ sectionId: filters.sectionId });
    }

    if (filters.authorId) {
      additionalFilters.push({ authorId: filters.authorId });
    }

    if (filters.status) {
      additionalFilters.push({ status: filters.status });
    }

    if (filters.dateFrom || filters.dateTo) {
      const dateFilter: any = {};
      if (filters.dateFrom) {
        dateFilter.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        dateFilter.lte = new Date(filters.dateTo);
      }
      additionalFilters.push({ publishedAt: dateFilter });
    }

    if (filters.priority) {
      additionalFilters.push({ priority: filters.priority });
    }

    if (filters.language) {
      additionalFilters.push({ language: filters.language });
    }

    if (filters.contentType) {
      additionalFilters.push({ contentType: filters.contentType });
    }

    if (filters.readingTime) {
      const readingTimeFilter: any = {};
      if (filters.readingTime.min) {
        readingTimeFilter.gte = filters.readingTime.min;
      }
      if (filters.readingTime.max) {
        readingTimeFilter.lte = filters.readingTime.max;
      }
      additionalFilters.push({ readingTime: readingTimeFilter });
    }

    if (filters.tags && filters.tags.length > 0) {
      additionalFilters.push({
        tags: {
          some: {
            name: {
              in: filters.tags,
            },
          },
        },
      });
    }

    if (additionalFilters.length > 0) {
      baseQuery.where.AND = additionalFilters;
    }
  }

  // Apply sorting
  if (sort) {
    switch (sort.field) {
      case 'relevance':
        // Relevance sorting will be handled by search engine
        break;
      case 'date':
        baseQuery.orderBy.push({ publishedAt: sort.order });
        break;
      case 'views':
        baseQuery.orderBy.push({ views: { _count: sort.order } });
        break;
      case 'likes':
        baseQuery.orderBy.push({ likes: { _count: sort.order } });
        break;
      case 'comments':
        baseQuery.orderBy.push({ comments: { _count: sort.order } });
        break;
      case 'title':
        baseQuery.orderBy.push({ title: sort.order });
        break;
      default:
        baseQuery.orderBy.push({ publishedAt: 'desc' });
    }
  }

  return baseQuery;
}

/**
 * Helper function to perform advanced search
 */
async function performAdvancedSearch(
  searchParams: z.infer<typeof searchQuerySchema>,
  userId?: string
) {
  const results = {
    articles: [],
    users: [],
    sections: [],
    tags: [],
    total: 0,
    facets: {},
    highlights: {},
  };

  // Check permissions
  const canViewDrafts = userId ? await validateUserPermissions(
    userId,
    'articles',
    'read_drafts'
  ) : false;

  // Build search query
  const searchQuery = buildSearchQuery(searchParams);

  // Add permission filters
  if (!canViewDrafts) {
    searchQuery.where.AND = searchQuery.where.AND || [];
    searchQuery.where.AND.push({ status: 'PUBLISHED' });
  }

  // Search based on type
  if (searchParams.type === 'articles' || searchParams.type === 'all') {
    const articles = await prisma.article.findMany({
      ...searchQuery,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            profile: {
              select: {
                avatar: true,
              },
            },
          },
        },
        section: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
            slug: true,
            color: true,
          },
        },
        _count: {
          select: {
            comments: true,
            views: true,
            likes: true,
            shares: true,
          },
        },
      },
    });

    results.articles = articles;
  }

  if (searchParams.type === 'users' || searchParams.type === 'all') {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: searchParams.query, mode: 'insensitive' } },
          { email: { contains: searchParams.query, mode: 'insensitive' } },
          { profile: { bio: { contains: searchParams.query, mode: 'insensitive' } } },
        ],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        profile: {
          select: {
            avatar: true,
            bio: true,
            socialLinks: true,
          },
        },
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
          },
        },
        _count: {
          select: {
            articles: true,
            comments: true,
          },
        },
      },
      take: searchParams.pagination?.limit || 10,
    });

    results.users = users;
  }

  if (searchParams.type === 'sections' || searchParams.type === 'all') {
    const sections = await prisma.section.findMany({
      where: {
        OR: [
          { name: { contains: searchParams.query, mode: 'insensitive' } },
          { description: { contains: searchParams.query, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        color: true,
        icon: true,
        _count: {
          select: {
            articles: true,
          },
        },
      },
      take: searchParams.pagination?.limit || 10,
    });

    results.sections = sections;
  }

  if (searchParams.type === 'tags' || searchParams.type === 'all') {
    const tags = await prisma.tag.findMany({
      where: {
        OR: [
          { name: { contains: searchParams.query, mode: 'insensitive' } },
          { description: { contains: searchParams.query, mode: 'insensitive' } },
        ],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        color: true,
        _count: {
          select: {
            articles: true,
          },
        },
      },
      take: searchParams.pagination?.limit || 10,
    });

    results.tags = tags;
  }

  // Calculate total
  results.total = results.articles.length + results.users.length + 
                  results.sections.length + results.tags.length;

  // Generate facets if requested
  if (searchParams.includeFacets) {
    results.facets = await generateSearchFacets(searchParams.query);
  }

  // Generate highlights if requested
  if (searchParams.includeHighlights) {
    results.highlights = generateHighlights(results, searchParams.query);
  }

  return results;
}

/**
 * Helper function to generate search facets
 */
async function generateSearchFacets(query: string) {
  const facets = {
    sections: [],
    authors: [],
    tags: [],
    dates: [],
    contentTypes: [],
  };

  // Get section facets
  const sectionFacets = await prisma.article.groupBy({
    by: ['sectionId'],
    where: {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
      ],
      status: 'PUBLISHED',
    },
    _count: {
      sectionId: true,
    },
    orderBy: {
      _count: {
        sectionId: 'desc',
      },
    },
    take: 10,
  });

  // Get section details
  const sectionIds = sectionFacets.map(f => f.sectionId).filter(Boolean);
  const sections = await prisma.section.findMany({
    where: {
      id: {
        in: sectionIds,
      },
    },
    select: {
      id: true,
      name: true,
      slug: true,
      color: true,
    },
  });

  facets.sections = sectionFacets.map(facet => ({
    ...sections.find(s => s.id === facet.sectionId),
    count: facet._count.sectionId,
  }));

  // Get author facets
  const authorFacets = await prisma.article.groupBy({
    by: ['authorId'],
    where: {
      OR: [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
      ],
      status: 'PUBLISHED',
    },
    _count: {
      authorId: true,
    },
    orderBy: {
      _count: {
        authorId: 'desc',
      },
    },
    take: 10,
  });

  // Get author details
  const authorIds = authorFacets.map(f => f.authorId).filter(Boolean);
  const authors = await prisma.user.findMany({
    where: {
      id: {
        in: authorIds,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      profile: {
        select: {
          avatar: true,
        },
      },
    },
  });

  facets.authors = authorFacets.map(facet => ({
    ...authors.find(a => a.id === facet.authorId),
    count: facet._count.authorId,
  }));

  return facets;
}

/**
 * Helper function to generate text highlights
 */
function generateHighlights(results: any, query: string) {
  const highlights = {};
  const normalizedQuery = normalizeArabicText(query);
  const queryWords = normalizedQuery.split(' ').filter(word => word.length > 2);

  // Generate highlights for articles
  if (results.articles.length > 0) {
    highlights.articles = results.articles.map(article => {
      const articleHighlights = {
        title: highlightText(article.title, queryWords),
        content: highlightText(article.content, queryWords, 150),
        excerpt: highlightText(article.excerpt, queryWords),
      };

      return {
        id: article.id,
        highlights: articleHighlights,
      };
    });
  }

  return highlights;
}

/**
 * Helper function to highlight text
 */
function highlightText(text: string, queryWords: string[], maxLength: number = 0) {
  if (!text) return '';

  let highlightedText = text;
  
  queryWords.forEach(word => {
    const regex = new RegExp(`(${word})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
  });

  if (maxLength > 0 && highlightedText.length > maxLength) {
    // Find the first highlighted word
    const markIndex = highlightedText.indexOf('<mark>');
    if (markIndex !== -1) {
      const start = Math.max(0, markIndex - 50);
      const end = Math.min(highlightedText.length, markIndex + maxLength - 50);
      highlightedText = '...' + highlightedText.substring(start, end) + '...';
    } else {
      highlightedText = highlightedText.substring(0, maxLength) + '...';
    }
  }

  return highlightedText;
}

/**
 * Helper function to record search analytics
 */
async function recordSearchAnalytics(
  query: string,
  type: string,
  resultsCount: number,
  userId?: string,
  ipAddress?: string
) {
  try {
    await prisma.searchAnalytics.create({
      data: {
        query: normalizeArabicText(query),
        type,
        resultsCount,
        userId,
        ipAddress,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Error recording search analytics:', error);
  }
}

/**
 * GET /api/search
 * Main search endpoint
 */
export async function GET(request: NextRequest) {
  try {
    const ipAddress = getClientIP(request);
    
    // Rate limiting
    const rateLimitResult = await rateLimiter.check(
      `search:${ipAddress}`,
      60, // 60 searches
      60 * 1000 // per minute
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'تم تجاوز الحد الأقصى لعمليات البحث',
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      );
    }

    // Get session (optional)
    const session = await getServerSession(authOptions);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    
    // Convert string values to proper types
    if (queryParams.pagination) {
      queryParams.pagination = JSON.parse(queryParams.pagination);
    }
    if (queryParams.filters) {
      queryParams.filters = JSON.parse(queryParams.filters);
    }
    if (queryParams.sort) {
      queryParams.sort = JSON.parse(queryParams.sort);
    }
    if (queryParams.includeHighlights) {
      queryParams.includeHighlights = queryParams.includeHighlights === 'true';
    }
    if (queryParams.includeFacets) {
      queryParams.includeFacets = queryParams.includeFacets === 'true';
    }

    const validatedQuery = searchQuerySchema.parse(queryParams);

    // Perform search
    const results = await performAdvancedSearch(validatedQuery, session?.user?.id);

    // Record search analytics
    await recordSearchAnalytics(
      validatedQuery.query,
      validatedQuery.type,
      results.total,
      session?.user?.id,
      ipAddress
    );

    // Log audit event
    await logAuditEvent({
      userId: session?.user?.id || 'anonymous',
      action: 'SEARCH',
      resource: 'search',
      metadata: {
        query: validatedQuery.query,
        type: validatedQuery.type,
        resultsCount: results.total,
        filters: validatedQuery.filters,
        timestamp: new Date().toISOString(),
      },
    });

    return NextResponse.json({
      success: true,
      data: results,
      pagination: {
        page: validatedQuery.pagination?.page || 1,
        limit: validatedQuery.pagination?.limit || 10,
        total: results.total,
        hasMore: results.total > (validatedQuery.pagination?.page || 1) * (validatedQuery.pagination?.limit || 10),
      },
      message: `تم العثور على ${results.total} نتيجة`,
    });

  } catch (error) {
    console.error('Error performing search:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'معايير البحث غير صحيحة',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'خطأ في عملية البحث',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/search/autocomplete
 * Autocomplete search suggestions
 */
export async function POST(request: NextRequest) {
  try {
    const ipAddress = getClientIP(request);
    
    // Rate limiting
    const rateLimitResult = await rateLimiter.check(
      `search-autocomplete:${ipAddress}`,
      100, // 100 requests
      60 * 1000 // per minute
    );

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'تم تجاوز الحد الأقصى لطلبات الإكمال التلقائي',
          retryAfter: rateLimitResult.retryAfter,
        },
        { status: 429 }
      );
    }

    // Parse request body
    const body = await request.json();
    const validatedData = autoCompleteSchema.parse(body);

    const suggestions = [];
    const normalizedQuery = normalizeArabicText(validatedData.query);

    // Get article suggestions
    if (validatedData.type === 'articles' || validatedData.type === 'all') {
      const articles = await prisma.article.findMany({
        where: {
          OR: [
            { title: { contains: normalizedQuery, mode: 'insensitive' } },
            { keywords: { hasSome: normalizedQuery.split(' ') } },
          ],
          status: 'PUBLISHED',
        },
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
        },
        take: Math.min(validatedData.limit, 10),
        orderBy: {
          views: {
            _count: 'desc',
          },
        },
      });

      suggestions.push(...articles.map(article => ({
        type: 'article',
        id: article.id,
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
      })));
    }

    // Get tag suggestions
    if (validatedData.type === 'tags' || validatedData.type === 'all') {
      const tags = await prisma.tag.findMany({
        where: {
          name: { contains: normalizedQuery, mode: 'insensitive' },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          _count: {
            select: {
              articles: true,
            },
          },
        },
        take: Math.min(validatedData.limit, 5),
        orderBy: {
          articles: {
            _count: 'desc',
          },
        },
      });

      suggestions.push(...tags.map(tag => ({
        type: 'tag',
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        count: tag._count.articles,
      })));
    }

    // Get section suggestions
    if (validatedData.type === 'sections' || validatedData.type === 'all') {
      const sections = await prisma.section.findMany({
        where: {
          name: { contains: normalizedQuery, mode: 'insensitive' },
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          color: true,
          _count: {
            select: {
              articles: true,
            },
          },
        },
        take: Math.min(validatedData.limit, 5),
        orderBy: {
          articles: {
            _count: 'desc',
          },
        },
      });

      suggestions.push(...sections.map(section => ({
        type: 'section',
        id: section.id,
        name: section.name,
        slug: section.slug,
        color: section.color,
        count: section._count.articles,
      })));
    }

    // Sort suggestions by relevance
    suggestions.sort((a, b) => {
      // Prioritize exact matches
      const aExact = a.title?.toLowerCase().includes(validatedData.query.toLowerCase()) || 
                     a.name?.toLowerCase().includes(validatedData.query.toLowerCase());
      const bExact = b.title?.toLowerCase().includes(validatedData.query.toLowerCase()) || 
                     b.name?.toLowerCase().includes(validatedData.query.toLowerCase());
      
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      
      // Then by count/popularity
      return (b.count || 0) - (a.count || 0);
    });

    return NextResponse.json({
      success: true,
      data: suggestions.slice(0, validatedData.limit),
      message: `تم العثور على ${suggestions.length} اقتراح`,
    });

  } catch (error) {
    console.error('Error getting autocomplete suggestions:', error);
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'معايير الإكمال التلقائي غير صحيحة',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'خطأ في الحصول على اقتراحات البحث',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
} 