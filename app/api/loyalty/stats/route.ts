import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { getMembershipLevel } from '@/lib/loyalty';

export async function GET(request: NextRequest) {
  try {
    // قراءة ملف نقاط الولاء
    const loyaltyPath = path.join(process.cwd(), 'data', 'user_loyalty_points.json');
    let loyaltyData: any = {};
    let loyaltyUsers: any[] = [];
    
    try {
      const loyaltyContent = await fs.readFile(loyaltyPath, 'utf-8');
      loyaltyData = JSON.parse(loyaltyContent);
      
      // تحويل البيانات من object إلى array
      if (typeof loyaltyData === 'object' && !Array.isArray(loyaltyData)) {
        loyaltyUsers = Object.values(loyaltyData);
      } else if (loyaltyData.users && Array.isArray(loyaltyData.users)) {
        loyaltyUsers = loyaltyData.users;
      } else if (Array.isArray(loyaltyData)) {
        loyaltyUsers = loyaltyData;
      }
    } catch (error) {
      console.error('Error reading loyalty points:', error);
    }

    // قراءة ملف المستخدمين (قاعدة بيانات العضويات)
    const usersPath = path.join(process.cwd(), 'data', 'users.json');
    let usersData: { users: any[] } = { users: [] };
    
    try {
      const usersContent = await fs.readFile(usersPath, 'utf-8');
      usersData = JSON.parse(usersContent);
    } catch (error) {
      console.error('Error reading users data:', error);
    }

    // قراءة ملف التفاعلات
    const interactionsPath = path.join(process.cwd(), 'data', 'user_article_interactions.json');
    let interactions: any[] = [];
    
    try {
      const interactionsContent = await fs.readFile(interactionsPath, 'utf-8');
      const data = JSON.parse(interactionsContent);
      interactions = data.interactions || [];
    } catch (error) {
      console.error('Error reading interactions:', error);
    }

    // تصفية التفاعلات التي لها نقاط فقط واستبعاد المجهولين
    const pointEarningInteractions = interactions.filter(i => 
      i.points_earned && 
      i.points_earned > 0 && 
      i.user_id !== 'anonymous'
    );

    // ربط بيانات الولاء مع بيانات العضويات (JOIN)
    const usersWithLoyalty = loyaltyUsers
      .filter((loyaltyUser: any) => loyaltyUser.user_id !== 'anonymous') // استبعاد المجهولين
      .map((loyaltyUser: any) => {
        // البحث عن المستخدم في قاعدة بيانات العضويات
        const userProfile = usersData.users.find(user => user.id === loyaltyUser.user_id);
        
        if (userProfile) {
          // حساب آخر نشاط للمستخدم
          const userInteractions = pointEarningInteractions.filter(i => i.user_id === loyaltyUser.user_id);
          const lastActivity = userInteractions.length > 0 
            ? userInteractions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0].timestamp
            : loyaltyUser.last_updated;

          return {
            // بيانات الولاء
            user_id: loyaltyUser.user_id,
            total_points: loyaltyUser.total_points || 0,
            earned_points: loyaltyUser.earned_points || 0,
            redeemed_points: loyaltyUser.redeemed_points || 0,
            tier: getMembershipLevel(loyaltyUser.total_points || 0).englishName,
            loyalty_created_at: loyaltyUser.created_at,
            loyalty_updated_at: loyaltyUser.last_updated,
            
            // بيانات العضوية (من users.json)
            name: userProfile.name,
            email: userProfile.email,
            avatar: userProfile.avatar || null,
            role: userProfile.role || 'عضو',
            email_verified: userProfile.email_verified || false,
            profile_created_at: userProfile.created_at,
            profile_updated_at: userProfile.updated_at,
            
            // بيانات النشاط
            last_activity: lastActivity,
            interactions_count: userInteractions.length,
            
            // حالة الحساب
            status: 'active' // يمكن إضافة منطق أكثر تعقيداً هنا
          };
        } else {
          // مستخدم له نقاط ولاء لكن غير موجود في قاعدة بيانات العضويات
          console.warn(`Loyalty user ${loyaltyUser.user_id} not found in users database`);
          return {
            user_id: loyaltyUser.user_id,
            total_points: loyaltyUser.total_points || 0,
            earned_points: loyaltyUser.earned_points || 0,
            redeemed_points: loyaltyUser.redeemed_points || 0,
            tier: getMembershipLevel(loyaltyUser.total_points || 0).englishName,
            loyalty_created_at: loyaltyUser.created_at,
            loyalty_updated_at: loyaltyUser.last_updated,
            
            // بيانات مفقودة
            name: `مستخدم غير معروف (${loyaltyUser.user_id})`,
            email: 'unknown@unknown.com',
            avatar: null,
            role: 'غير محدد',
            email_verified: false,
            profile_created_at: null,
            profile_updated_at: null,
            last_activity: loyaltyUser.last_updated,
            interactions_count: 0,
            status: 'orphaned' // حساب ولاء بدون عضوية
          };
        }
      })
      .filter(user => user !== null); // إزالة أي قيم null

    // البحث عن أعضاء لديهم حسابات لكن بدون نقاط ولاء
    const membersWithoutLoyalty = usersData.users
      .filter((user: any) => !loyaltyUsers.some((loyaltyUser: any) => loyaltyUser.user_id === user.id))
      .map((user: any) => ({
        user_id: user.id,
        total_points: 0,
        earned_points: 0,
        redeemed_points: 0,
        tier: 'new',
        loyalty_created_at: null,
        loyalty_updated_at: null,
        
        name: user.name,
        email: user.email,
        avatar: user.avatar || null,
        role: user.role || 'عضو',
        email_verified: user.email_verified || false,
        profile_created_at: user.created_at,
        profile_updated_at: user.updated_at,
        
        last_activity: user.updated_at,
        interactions_count: 0,
        status: 'no_loyalty' // عضو بدون نشاط ولاء
      }));

    // دمج البيانات
    const allUsers = [...usersWithLoyalty, ...membersWithoutLoyalty];

    // حساب الإحصائيات العامة
    const totalUsers = usersWithLoyalty.length; // فقط المستخدمين الذين لديهم نقاط
    const totalMembers = usersData.users.length; // جميع الأعضاء
    const totalPoints = usersWithLoyalty.reduce((sum: number, user: any) => sum + (user.total_points || 0), 0);
    const averagePoints = totalUsers > 0 ? Math.round(totalPoints / totalUsers) : 0;

    // حساب المستخدمين النشطين (الذين حصلوا على نقاط في آخر 7 أيام)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const recentActiveUsers = new Set(
      pointEarningInteractions
        .filter(i => new Date(i.timestamp) > weekAgo)
        .map(i => i.user_id)
    );
    const activeUsers = recentActiveUsers.size;

    // حساب الأعضاء الجدد (هذا الشهر)
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    
    const newMembers = usersData.users.filter((user: any) => 
      new Date(user.created_at) > monthAgo
    ).length;

    // حساب سفراء سبق (المستخدمين مع أكثر من 2000 نقطة)
    const ambassadors = usersWithLoyalty.filter((user: any) => 
      (user.total_points || 0) >= 2000
    ).length;

    // أعلى المستخدمين (أعلى 10) مع بيانات كاملة
    const topUsers = usersWithLoyalty
      .sort((a: any, b: any) => (b.total_points || 0) - (a.total_points || 0))
      .slice(0, 10)
      .map((user: any) => ({
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        total_points: user.total_points || 0,
        tier: getMembershipLevel(user.total_points || 0).englishName,
        last_activity: user.last_activity,
        interactions_count: user.interactions_count,
        status: user.status
      }));

    // إحصائيات التفاعلات
    const readInteractions = pointEarningInteractions.filter(i => i.interaction_type === 'read').length;
    const likeInteractions = pointEarningInteractions.filter(i => i.interaction_type === 'like').length;
    const shareInteractions = pointEarningInteractions.filter(i => i.interaction_type === 'share').length;
    const saveInteractions = pointEarningInteractions.filter(i => i.interaction_type === 'save').length;
    const viewInteractions = pointEarningInteractions.filter(i => i.interaction_type === 'view').length;

    // حساب النقاط الموزعة حسب النوع
    const pointsByType = {
      read: pointEarningInteractions
        .filter(i => i.interaction_type === 'read')
        .reduce((sum, i) => sum + (i.points_earned || 0), 0),
      like: pointEarningInteractions
        .filter(i => i.interaction_type === 'like')
        .reduce((sum, i) => sum + (i.points_earned || 0), 0),
      share: pointEarningInteractions
        .filter(i => i.interaction_type === 'share')
        .reduce((sum, i) => sum + (i.points_earned || 0), 0),
      save: pointEarningInteractions
        .filter(i => i.interaction_type === 'save')
        .reduce((sum, i) => sum + (i.points_earned || 0), 0),
      view: pointEarningInteractions
        .filter(i => i.interaction_type === 'view')
        .reduce((sum, i) => sum + (i.points_earned || 0), 0)
    };

    // النشاط اليومي للأسبوع الماضي
    const dailyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(day);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const dayInteractions = pointEarningInteractions.filter(interaction => {
        const interactionDate = new Date(interaction.timestamp);
        return interactionDate >= day && interactionDate < nextDay;
      });
      
      const dayPoints = dayInteractions.reduce((sum, i) => sum + (i.points_earned || 0), 0);
      const uniqueUsers = new Set(dayInteractions.map(i => i.user_id)).size;
      
      dailyActivity.push({
        date: day.toISOString().split('T')[0],
        points: dayPoints,
        users: uniqueUsers,
        interactions: dayInteractions.length
      });
    }

    // التوزيع حسب المستويات
    const tierDistribution = {
      bronze: usersWithLoyalty.filter(u => (u.total_points || 0) < 101).length,
      silver: usersWithLoyalty.filter(u => (u.total_points || 0) >= 101 && (u.total_points || 0) < 501).length,
      gold: usersWithLoyalty.filter(u => (u.total_points || 0) >= 501 && (u.total_points || 0) < 2001).length,
      ambassador: usersWithLoyalty.filter(u => (u.total_points || 0) >= 2001).length
    };

    // حالات الحسابات
    const accountStatuses = {
      active: usersWithLoyalty.filter(u => u.status === 'active').length,
      orphaned: usersWithLoyalty.filter(u => u.status === 'orphaned').length,
      no_loyalty: membersWithoutLoyalty.length
    };

    return NextResponse.json({
      success: true,
      data: {
        // الإحصائيات الأساسية
        overview: {
          totalUsers, // مستخدمي الولاء
          totalMembers, // جميع الأعضاء
          activeUsers,
          totalPoints,
          averagePoints,
          newMembers,
          ambassadors
        },
        
        // أعلى المستخدمين مع بيانات كاملة
        topUsers,
        
        // جميع المستخدمين (مع وبدون ولاء)
        allUsers: allUsers.sort((a, b) => (b.total_points || 0) - (a.total_points || 0)),
        
        // إحصائيات التفاعلات
        interactions: {
          total: pointEarningInteractions.length,
          breakdown: {
            read: readInteractions,
            like: likeInteractions,
            share: shareInteractions,
            save: saveInteractions,
            view: viewInteractions
          },
          pointsByType
        },
        
        // النشاط اليومي
        dailyActivity,
        
        // توزيع المستويات
        tierDistribution,
        
        // حالات الحسابات
        accountStatuses,
        
        // معلومات إضافية
        metadata: {
          lastUpdated: new Date().toISOString(),
          dataSource: 'file_system_with_join',
          totalInteractions: interactions.length,
          pointEarningInteractions: pointEarningInteractions.length,
          usersWithLoyalty: usersWithLoyalty.length,
          membersWithoutLoyalty: membersWithoutLoyalty.length,
          orphanedLoyaltyAccounts: usersWithLoyalty.filter(u => u.status === 'orphaned').length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching loyalty stats:', error);
    return NextResponse.json({
      success: false,
      message: 'حدث خطأ في جلب إحصائيات الولاء',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 