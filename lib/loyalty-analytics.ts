import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AnalyticsTimeframe {
  start: Date;
  end: Date;
  period: 'hour' | 'day' | 'week' | 'month' | 'year';
}

interface LoyaltyAnalytics {
  overview: {
    total_users: number;
    active_users: number;
    total_points_distributed: number;
    total_badges_awarded: number;
    average_points_per_user: number;
    engagement_rate: number;
  };
  trends: {
    points_over_time: Array<{ date: string; points: number; users: number }>;
    badges_over_time: Array<{ date: string; badges: number; users: number }>;
    user_activity: Array<{ date: string; active_users: number; new_users: number }>;
  };
  distribution: {
    points_by_action: Record<string, number>;
    badges_by_category: Record<string, number>;
    badges_by_tier: Record<string, number>;
    users_by_level: Record<string, number>;
  };
  leaderboards: {
    top_users_by_points: Array<{
      user_id: string;
      name: string;
      points: number;
      badges: number;
      level: string;
    }>;
    top_users_by_badges: Array<{
      user_id: string;
      name: string;
      badges: number;
      points: number;
      level: string;
    }>;
    most_active_users: Array<{
      user_id: string;
      name: string;
      activities: number;
      last_activity: Date;
    }>;
  };
  insights: {
    retention_rate: number;
    churn_rate: number;
    average_session_duration: number;
    popular_actions: Array<{ action: string; count: number; points: number }>;
    badge_completion_rate: Record<string, number>;
    level_progression: Array<{ level: string; users: number; avg_time: number }>;
  };
}

/**
 * مدير تحليلات نظام النقاط والشارات
 */
export class LoyaltyAnalyticsManager {
  
  /**
   * إنشاء تقرير تحليلي شامل
   */
  static async generateAnalyticsReport(timeframe: AnalyticsTimeframe): Promise<LoyaltyAnalytics> {
    const [
      overview,
      trends,
      distribution,
      leaderboards,
      insights
    ] = await Promise.all([
      this.getOverviewAnalytics(timeframe),
      this.getTrendsAnalytics(timeframe),
      this.getDistributionAnalytics(timeframe),
      this.getLeaderboards(timeframe),
      this.getInsightsAnalytics(timeframe)
    ]);

    return {
      overview,
      trends,
      distribution,
      leaderboards,
      insights
    };
  }

  /**
   * نظرة عامة على الإحصائيات
   */
  static async getOverviewAnalytics(timeframe: AnalyticsTimeframe) {
    const [
      totalUsers,
      activeUsers,
      totalPoints,
      totalBadges,
      userStats
    ] = await Promise.all([
      // إجمالي المستخدمين
      prisma.user.count({
        where: {
          created_at: { lte: timeframe.end }
        }
      }),
      
      // المستخدمين النشطين
      prisma.user.count({
        where: {
          loyalty_stats: {
            last_activity_date: {
              gte: timeframe.start,
              lte: timeframe.end
            }
          }
        }
      }),
      
      // إجمالي النقاط الموزعة
      prisma.loyaltyPoint.aggregate({
        _sum: { points: true },
        where: {
          created_at: {
            gte: timeframe.start,
            lte: timeframe.end
          }
        }
      }),
      
      // إجمالي الشارات الممنوحة
      prisma.userBadge.count({
        where: {
          awarded_at: {
            gte: timeframe.start,
            lte: timeframe.end
          }
        }
      }),
      
      // إحصائيات المستخدمين
      prisma.userLoyaltyStats.aggregate({
        _avg: { current_points: true },
        _count: { user_id: true }
      })
    ]);

    const averagePointsPerUser = userStats._avg.current_points || 0;
    const engagementRate = totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;

    return {
      total_users: totalUsers,
      active_users: activeUsers,
      total_points_distributed: totalPoints._sum.points || 0,
      total_badges_awarded: totalBadges,
      average_points_per_user: averagePointsPerUser,
      engagement_rate: engagementRate
    };
  }

  /**
   * اتجاهات النشاط
   */
  static async getTrendsAnalytics(timeframe: AnalyticsTimeframe) {
    const dateFormat = this.getDateFormat(timeframe.period);
    
    const [pointsOverTime, badgesOverTime, userActivity] = await Promise.all([
      // نقاط عبر الوقت
      prisma.$queryRaw`
        SELECT 
          DATE_FORMAT(created_at, ${dateFormat}) as date,
          SUM(points) as points,
          COUNT(DISTINCT user_id) as users
        FROM loyalty_points 
        WHERE created_at >= ${timeframe.start} AND created_at <= ${timeframe.end}
        GROUP BY DATE_FORMAT(created_at, ${dateFormat})
        ORDER BY date
      `,
      
      // شارات عبر الوقت
      prisma.$queryRaw`
        SELECT 
          DATE_FORMAT(awarded_at, ${dateFormat}) as date,
          COUNT(*) as badges,
          COUNT(DISTINCT user_id) as users
        FROM user_badges 
        WHERE awarded_at >= ${timeframe.start} AND awarded_at <= ${timeframe.end}
        GROUP BY DATE_FORMAT(awarded_at, ${dateFormat})
        ORDER BY date
      `,
      
      // نشاط المستخدمين
      prisma.$queryRaw`
        SELECT 
          DATE_FORMAT(last_activity_date, ${dateFormat}) as date,
          COUNT(*) as active_users,
          COUNT(CASE WHEN created_at >= ${timeframe.start} THEN 1 END) as new_users
        FROM user_loyalty_stats 
        WHERE last_activity_date >= ${timeframe.start} AND last_activity_date <= ${timeframe.end}
        GROUP BY DATE_FORMAT(last_activity_date, ${dateFormat})
        ORDER BY date
      `
    ]);

    return {
      points_over_time: pointsOverTime as any[],
      badges_over_time: badgesOverTime as any[],
      user_activity: userActivity as any[]
    };
  }

  /**
   * توزيع البيانات
   */
  static async getDistributionAnalytics(timeframe: AnalyticsTimeframe) {
    const [
      pointsByAction,
      badgesByCategory,
      badgesByTier,
      usersByLevel
    ] = await Promise.all([
      // توزيع النقاط حسب نوع العمل
      prisma.loyaltyPoint.groupBy({
        by: ['action_type'],
        where: {
          created_at: {
            gte: timeframe.start,
            lte: timeframe.end
          }
        },
        _sum: { points: true }
      }),
      
      // توزيع الشارات حسب الفئة
      prisma.userBadge.groupBy({
        by: ['badge'],
        where: {
          awarded_at: {
            gte: timeframe.start,
            lte: timeframe.end
          }
        },
        include: {
          badge: {
            select: { category: true }
          }
        },
        _count: { id: true }
      }),
      
      // توزيع الشارات حسب المستوى
      prisma.userBadge.groupBy({
        by: ['badge'],
        where: {
          awarded_at: {
            gte: timeframe.start,
            lte: timeframe.end
          }
        },
        include: {
          badge: {
            select: { tier: true }
          }
        },
        _count: { id: true }
      }),
      
      // توزيع المستخدمين حسب المستوى
      prisma.userLoyaltyStats.groupBy({
        by: ['current_level'],
        _count: { user_id: true }
      })
    ]);

    return {
      points_by_action: pointsByAction.reduce((acc, item) => {
        acc[item.action_type] = item._sum.points || 0;
        return acc;
      }, {} as Record<string, number>),
      
      badges_by_category: badgesByCategory.reduce((acc, item) => {
        const category = (item as any).badge.category;
        acc[category] = (acc[category] || 0) + item._count.id;
        return acc;
      }, {} as Record<string, number>),
      
      badges_by_tier: badgesByTier.reduce((acc, item) => {
        const tier = (item as any).badge.tier;
        acc[tier] = (acc[tier] || 0) + item._count.id;
        return acc;
      }, {} as Record<string, number>),
      
      users_by_level: usersByLevel.reduce((acc, item) => {
        acc[item.current_level || 'غير محدد'] = item._count.user_id;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  /**
   * قوائم المتصدرين
   */
  static async getLeaderboards(timeframe: AnalyticsTimeframe) {
    const [topUsersByPoints, topUsersByBadges, mostActiveUsers] = await Promise.all([
      // أفضل المستخدمين بالنقاط
      prisma.userLoyaltyStats.findMany({
        take: 10,
        orderBy: { current_points: 'desc' },
        include: {
          user: {
            select: { id: true, name: true }
          }
        }
      }),
      
      // أفضل المستخدمين بالشارات
      prisma.userLoyaltyStats.findMany({
        take: 10,
        orderBy: { badges_count: 'desc' },
        include: {
          user: {
            select: { id: true, name: true }
          }
        }
      }),
      
      // أكثر المستخدمين نشاطاً
      prisma.loyaltyPoint.groupBy({
        by: ['user_id'],
        where: {
          created_at: {
            gte: timeframe.start,
            lte: timeframe.end
          }
        },
        _count: { id: true },
        _max: { created_at: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      }).then(async (results) => {
        const userIds = results.map(r => r.user_id);
        const users = await prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, name: true }
        });
        
        return results.map(result => {
          const user = users.find(u => u.id === result.user_id);
          return {
            user_id: result.user_id,
            name: user?.name || 'غير معروف',
            activities: result._count.id,
            last_activity: result._max.created_at!
          };
        });
      })
    ]);

    return {
      top_users_by_points: topUsersByPoints.map(stat => ({
        user_id: stat.user.id,
        name: stat.user.name,
        points: stat.current_points,
        badges: stat.badges_count,
        level: stat.current_level || 'غير محدد'
      })),
      
      top_users_by_badges: topUsersByBadges.map(stat => ({
        user_id: stat.user.id,
        name: stat.user.name,
        badges: stat.badges_count,
        points: stat.current_points,
        level: stat.current_level || 'غير محدد'
      })),
      
      most_active_users: mostActiveUsers
    };
  }

  /**
   * رؤى وتحليلات متقدمة
   */
  static async getInsightsAnalytics(timeframe: AnalyticsTimeframe) {
    const [
      retentionData,
      popularActions,
      badgeCompletion,
      levelProgression
    ] = await Promise.all([
      // بيانات الاحتفاظ
      this.calculateRetentionRate(timeframe),
      
      // الأنشطة الشائعة
      prisma.loyaltyPoint.groupBy({
        by: ['action_type'],
        where: {
          created_at: {
            gte: timeframe.start,
            lte: timeframe.end
          }
        },
        _count: { id: true },
        _sum: { points: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      }),
      
      // معدل إكمال الشارات
      this.calculateBadgeCompletionRate(),
      
      // تقدم المستويات
      this.calculateLevelProgression()
    ]);

    return {
      retention_rate: retentionData.retention_rate,
      churn_rate: retentionData.churn_rate,
      average_session_duration: await this.calculateAverageSessionDuration(timeframe),
      popular_actions: popularActions.map(action => ({
        action: action.action_type,
        count: action._count.id,
        points: action._sum.points || 0
      })),
      badge_completion_rate: badgeCompletion,
      level_progression: levelProgression
    };
  }

  /**
   * حساب معدل الاحتفاظ
   */
  static async calculateRetentionRate(timeframe: AnalyticsTimeframe) {
    const periodDays = Math.ceil((timeframe.end.getTime() - timeframe.start.getTime()) / (1000 * 60 * 60 * 24));
    const midPoint = new Date(timeframe.start.getTime() + (timeframe.end.getTime() - timeframe.start.getTime()) / 2);
    
    // المستخدمين النشطين في النصف الأول
    const firstHalfUsers = await prisma.userLoyaltyStats.count({
      where: {
        last_activity_date: {
          gte: timeframe.start,
          lte: midPoint
        }
      }
    });
    
    // المستخدمين النشطين في النصف الثاني
    const secondHalfUsers = await prisma.userLoyaltyStats.count({
      where: {
        last_activity_date: {
          gte: midPoint,
          lte: timeframe.end
        }
      }
    });
    
    // المستخدمين النشطين في كلا النصفين
    const retainedUsers = await prisma.userLoyaltyStats.count({
      where: {
        AND: [
          { last_activity_date: { gte: timeframe.start } },
          { last_activity_date: { lte: timeframe.end } },
          {
            user: {
              loyalty_points: {
                some: {
                  AND: [
                    { created_at: { gte: timeframe.start, lte: midPoint } },
                    { created_at: { gte: midPoint, lte: timeframe.end } }
                  ]
                }
              }
            }
          }
        ]
      }
    });

    const retentionRate = firstHalfUsers > 0 ? (retainedUsers / firstHalfUsers) * 100 : 0;
    const churnRate = 100 - retentionRate;

    return {
      retention_rate: retentionRate,
      churn_rate: churnRate
    };
  }

  /**
   * حساب معدل إكمال الشارات
   */
  static async calculateBadgeCompletionRate() {
    const badges = await prisma.badge.findMany({
      where: { is_active: true },
      include: {
        user_badges: true
      }
    });

    const totalUsers = await prisma.user.count();
    const completionRates: Record<string, number> = {};

    badges.forEach(badge => {
      const completionRate = totalUsers > 0 ? (badge.user_badges.length / totalUsers) * 100 : 0;
      completionRates[badge.name] = completionRate;
    });

    return completionRates;
  }

  /**
   * حساب تقدم المستويات
   */
  static async calculateLevelProgression() {
    const levels = await prisma.loyaltyLevel.findMany({
      orderBy: { min_points: 'asc' }
    });

    const progression = await Promise.all(
      levels.map(async (level) => {
        const usersInLevel = await prisma.userLoyaltyStats.count({
          where: { current_level: level.name }
        });

        // حساب متوسط الوقت للوصول إلى هذا المستوى
        const avgTime = await this.calculateAverageTimeToLevel(level.name);

        return {
          level: level.name,
          users: usersInLevel,
          avg_time: avgTime
        };
      })
    );

    return progression;
  }

  /**
   * حساب متوسط الوقت للوصول إلى مستوى معين
   */
  static async calculateAverageTimeToLevel(levelName: string): Promise<number> {
    const usersInLevel = await prisma.userLoyaltyStats.findMany({
      where: { current_level: levelName },
      include: {
        user: {
          select: { created_at: true }
        }
      }
    });

    if (usersInLevel.length === 0) return 0;

    const totalTime = usersInLevel.reduce((sum, userStat) => {
      const timeToLevel = Date.now() - userStat.user.created_at.getTime();
      return sum + timeToLevel;
    }, 0);

    return totalTime / usersInLevel.length / (1000 * 60 * 60 * 24); // في الأيام
  }

  /**
   * حساب متوسط مدة الجلسة
   */
  static async calculateAverageSessionDuration(timeframe: AnalyticsTimeframe): Promise<number> {
    // هذا مثال بسيط - يمكن تحسينه بناءً على بيانات الجلسات الفعلية
    const userSessions = await prisma.loyaltyPoint.groupBy({
      by: ['user_id'],
      where: {
        created_at: {
          gte: timeframe.start,
          lte: timeframe.end
        }
      },
      _min: { created_at: true },
      _max: { created_at: true },
      _count: { id: true }
    });

    if (userSessions.length === 0) return 0;

    const totalDuration = userSessions.reduce((sum, session) => {
      if (session._min.created_at && session._max.created_at) {
        const duration = session._max.created_at.getTime() - session._min.created_at.getTime();
        return sum + duration;
      }
      return sum;
    }, 0);

    return totalDuration / userSessions.length / (1000 * 60); // في الدقائق
  }

  /**
   * تحديد تنسيق التاريخ حسب الفترة
   */
  static getDateFormat(period: string): string {
    switch (period) {
      case 'hour':
        return '%Y-%m-%d %H:00:00';
      case 'day':
        return '%Y-%m-%d';
      case 'week':
        return '%Y-%u';
      case 'month':
        return '%Y-%m';
      case 'year':
        return '%Y';
      default:
        return '%Y-%m-%d';
    }
  }

  /**
   * إنشاء تقرير مخصص
   */
  static async generateCustomReport(
    metrics: string[],
    filters: Record<string, any>,
    timeframe: AnalyticsTimeframe
  ): Promise<any> {
    const report: any = {};

    for (const metric of metrics) {
      switch (metric) {
        case 'user_growth':
          report.user_growth = await this.getUserGrowthMetrics(timeframe, filters);
          break;
        case 'engagement_metrics':
          report.engagement_metrics = await this.getEngagementMetrics(timeframe, filters);
          break;
        case 'point_economy':
          report.point_economy = await this.getPointEconomyMetrics(timeframe, filters);
          break;
        case 'badge_performance':
          report.badge_performance = await this.getBadgePerformanceMetrics(timeframe, filters);
          break;
        case 'user_segments':
          report.user_segments = await this.getUserSegmentAnalysis(timeframe, filters);
          break;
      }
    }

    return report;
  }

  /**
   * مقاييس نمو المستخدمين
   */
  static async getUserGrowthMetrics(timeframe: AnalyticsTimeframe, filters: any) {
    const newUsers = await prisma.user.count({
      where: {
        created_at: {
          gte: timeframe.start,
          lte: timeframe.end
        },
        ...filters
      }
    });

    const activeUsers = await prisma.userLoyaltyStats.count({
      where: {
        last_activity_date: {
          gte: timeframe.start,
          lte: timeframe.end
        }
      }
    });

    return {
      new_users: newUsers,
      active_users: activeUsers,
      growth_rate: newUsers > 0 ? (activeUsers / newUsers) * 100 : 0
    };
  }

  /**
   * مقاييس المشاركة
   */
  static async getEngagementMetrics(timeframe: AnalyticsTimeframe, filters: any) {
    const totalActions = await prisma.loyaltyPoint.count({
      where: {
        created_at: {
          gte: timeframe.start,
          lte: timeframe.end
        }
      }
    });

    const uniqueUsers = await prisma.loyaltyPoint.groupBy({
      by: ['user_id'],
      where: {
        created_at: {
          gte: timeframe.start,
          lte: timeframe.end
        }
      }
    });

    const avgActionsPerUser = uniqueUsers.length > 0 ? totalActions / uniqueUsers.length : 0;

    return {
      total_actions: totalActions,
      unique_active_users: uniqueUsers.length,
      avg_actions_per_user: avgActionsPerUser
    };
  }

  /**
   * مقاييس اقتصاد النقاط
   */
  static async getPointEconomyMetrics(timeframe: AnalyticsTimeframe, filters: any) {
    const pointsDistributed = await prisma.loyaltyPoint.aggregate({
      _sum: { points: true },
      where: {
        created_at: {
          gte: timeframe.start,
          lte: timeframe.end
        }
      }
    });

    const pointsSpent = await prisma.loyaltyTransaction.aggregate({
      _sum: { points_amount: true },
      where: {
        transaction_type: 'spend',
        processed_at: {
          gte: timeframe.start,
          lte: timeframe.end
        }
      }
    });

    return {
      points_distributed: pointsDistributed._sum.points || 0,
      points_spent: Math.abs(pointsSpent._sum.points_amount || 0),
      net_points: (pointsDistributed._sum.points || 0) - Math.abs(pointsSpent._sum.points_amount || 0)
    };
  }

  /**
   * مقاييس أداء الشارات
   */
  static async getBadgePerformanceMetrics(timeframe: AnalyticsTimeframe, filters: any) {
    const badgeStats = await prisma.badge.findMany({
      include: {
        user_badges: {
          where: {
            awarded_at: {
              gte: timeframe.start,
              lte: timeframe.end
            }
          }
        }
      }
    });

    return badgeStats.map(badge => ({
      badge_name: badge.name,
      awards_count: badge.user_badges.length,
      category: badge.category,
      tier: badge.tier
    }));
  }

  /**
   * تحليل شرائح المستخدمين
   */
  static async getUserSegmentAnalysis(timeframe: AnalyticsTimeframe, filters: any) {
    const segments = await prisma.userLoyaltyStats.groupBy({
      by: ['current_level'],
      _count: { user_id: true },
      _avg: { current_points: true, current_streak: true }
    });

    return segments.map(segment => ({
      segment: segment.current_level || 'غير محدد',
      user_count: segment._count.user_id,
      avg_points: segment._avg.current_points || 0,
      avg_streak: segment._avg.current_streak || 0
    }));
  }

  /**
   * تصدير التقرير
   */
  static async exportReport(reportData: any, format: 'json' | 'csv' | 'pdf' = 'json'): Promise<Buffer | string> {
    switch (format) {
      case 'csv':
        return this.convertToCSV(reportData);
      case 'pdf':
        return this.convertToPDF(reportData);
      default:
        return JSON.stringify(reportData, null, 2);
    }
  }

  /**
   * تحويل إلى CSV
   */
  static convertToCSV(data: any): string {
    // تنفيذ بسيط لتحويل JSON إلى CSV
    const flattenObject = (obj: any, prefix = ''): any => {
      const flattened: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const newKey = prefix ? `${prefix}.${key}` : key;
          if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
            Object.assign(flattened, flattenObject(obj[key], newKey));
          } else {
            flattened[newKey] = obj[key];
          }
        }
      }
      return flattened;
    };

    const flattened = flattenObject(data);
    const headers = Object.keys(flattened).join(',');
    const values = Object.values(flattened).join(',');
    
    return `${headers}\n${values}`;
  }

  /**
   * تحويل إلى PDF
   */
  static async convertToPDF(data: any): Promise<Buffer> {
    // هذا يتطلب مكتبة PDF مثل puppeteer أو jsPDF
    // تنفيذ مبسط
    const content = JSON.stringify(data, null, 2);
    return Buffer.from(content, 'utf8');
  }
}

export default LoyaltyAnalyticsManager; 