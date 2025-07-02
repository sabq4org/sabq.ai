'use client';

import { useState, useEffect, useCallback } from 'react';

interface DashboardCounts {
  articles?: number;
  categories?: number;
  users?: number;
  teamMembers?: number;
  templates?: number;
  smartBlocks?: number;
  deepAnalysis?: number;
  activities?: number;
  notifications?: number;
  loyaltyMembers?: number;
}

export function useDashboardCounts() {
  const [counts, setCounts] = useState<DashboardCounts>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCounts = useCallback(async () => {
    try {
      setError(null);
      
      // جلب البيانات من API endpoints مختلفة
      const responses = await Promise.allSettled([
        fetch('/api/articles'), // 0: المقالات
        fetch('/api/categories'), // 1: التصنيفات
        fetch('/api/users'), // 2: المستخدمين
        fetch('/api/templates'), // 3: القوالب
        fetch('/api/smart-blocks'), // 4: البلوكات الذكية
        fetch('/api/deep-analyses'), // 5: التحليل العميق
        fetch('/api/team-members'), // 6: أعضاء الفريق
        fetch('/api/loyalty/stats'), // 7: إحصائيات برنامج الولاء
        fetch('/api/activities'), // 8: النشاطات
      ]);

      const newCounts: DashboardCounts = {};

      // معالجة المقالات
      if (responses[0].status === 'fulfilled' && responses[0].value.ok) {
        try {
          const articlesData = await responses[0].value.json();
          if (articlesData.success && articlesData.articles) {
            newCounts.articles = articlesData.articles.length;
          } else if (articlesData.data && Array.isArray(articlesData.data)) {
            newCounts.articles = articlesData.data.length;
          } else if (articlesData.pagination) {
            newCounts.articles = articlesData.pagination.total;
          }
        } catch (e) {
          console.log('Error parsing articles response:', e);
        }
      }

      // معالجة التصنيفات
      if (responses[1].status === 'fulfilled' && responses[1].value.ok) {
        try {
          const categoriesData = await responses[1].value.json();
          if (categoriesData.success && categoriesData.categories) {
            newCounts.categories = categoriesData.categories.length;
          } else if (Array.isArray(categoriesData)) {
            newCounts.categories = categoriesData.length;
          }
        } catch (e) {
          console.log('Error parsing categories response:', e);
        }
      }

      // معالجة المستخدمين
      if (responses[2].status === 'fulfilled' && responses[2].value.ok) {
        try {
          const usersData = await responses[2].value.json();
          console.log('Users API Response:', usersData); // للتحقق من البيانات
          
          if (usersData.success && usersData.data) {
            // البيانات تأتي في usersData.data وليس usersData.users
            newCounts.users = Array.isArray(usersData.data) ? usersData.data.length : 0;
          } else if (usersData.success && usersData.users) {
            newCounts.users = usersData.users.length;
          } else if (Array.isArray(usersData)) {
            newCounts.users = usersData.length;
          } else if (usersData.pagination) {
            newCounts.users = usersData.pagination.total;
          }
          
          console.log('Final users count:', newCounts.users); // للتحقق من العدد النهائي
        } catch (e) {
          console.log('Error parsing users response:', e);
        }
      }

      // معالجة القوالب
      if (responses[3].status === 'fulfilled' && responses[3].value.ok) {
        try {
          const templatesData = await responses[3].value.json();
          if (templatesData.success && templatesData.templates) {
            newCounts.templates = templatesData.templates.length;
          } else if (Array.isArray(templatesData)) {
            newCounts.templates = templatesData.length;
          }
        } catch (e) {
          console.log('Error parsing templates response:', e);
        }
      }

      // معالجة البلوكات الذكية
      if (responses[4].status === 'fulfilled' && responses[4].value.ok) {
        try {
          const smartBlocksData = await responses[4].value.json();
          if (smartBlocksData.success && smartBlocksData.blocks) {
            newCounts.smartBlocks = smartBlocksData.blocks.length;
          } else if (Array.isArray(smartBlocksData)) {
            newCounts.smartBlocks = smartBlocksData.length;
          }
        } catch (e) {
          console.log('Error parsing smart blocks response:', e);
        }
      }

      // معالجة التحليل العميق
      if (responses[5].status === 'fulfilled' && responses[5].value.ok) {
        try {
          const deepAnalysisData = await responses[5].value.json();
          if (deepAnalysisData.success && deepAnalysisData.analyses) {
            newCounts.deepAnalysis = deepAnalysisData.analyses.length;
          } else if (Array.isArray(deepAnalysisData)) {
            newCounts.deepAnalysis = deepAnalysisData.length;
          }
        } catch (e) {
          console.log('Error parsing deep analysis response:', e);
        }
      }

      // معالجة أعضاء الفريق
      if (responses[6].status === 'fulfilled' && responses[6].value.ok) {
        try {
          const teamData = await responses[6].value.json();
          if (teamData.success && teamData.teamMembers) {
            newCounts.teamMembers = teamData.teamMembers.length;
          } else if (teamData.members) {
            newCounts.teamMembers = teamData.members.length;
          } else if (Array.isArray(teamData)) {
            newCounts.teamMembers = teamData.length;
          }
        } catch (e) {
          console.log('Error parsing team members response:', e);
        }
      }

      // معالجة برنامج الولاء - استخدام إحصائيات حقيقية
      if (responses[7].status === 'fulfilled' && responses[7].value.ok) {
        try {
          const loyaltyData = await responses[7].value.json();
          if (loyaltyData.success && loyaltyData.data) {
            // استخدام العدد الحقيقي للأعضاء من الإحصائيات
            newCounts.loyaltyMembers = loyaltyData.data.overview?.totalMembers || 
                                      loyaltyData.data.overview?.totalUsers || 0;
          }
        } catch (e) {
          console.log('Error parsing loyalty response:', e);
        }
      }

      // معالجة النشاطات
      if (responses[8].status === 'fulfilled' && responses[8].value.ok) {
        try {
          const activitiesData = await responses[8].value.json();
          if (activitiesData.success && activitiesData.activities) {
            newCounts.activities = activitiesData.activities.length;
          } else if (Array.isArray(activitiesData)) {
            newCounts.activities = activitiesData.length;
          } else if (activitiesData.pagination) {
            newCounts.activities = activitiesData.pagination.total;
          }
        } catch (e) {
          console.log('Error parsing activities response:', e);
        }
      }

      // إضافة إشعارات وهمية للعرض (يمكن استبدالها بـ API حقيقي لاحقاً)
      newCounts.notifications = Math.floor(Math.random() * 5) + 1;

      setCounts(newCounts);
    } catch (error) {
      console.error('Error fetching dashboard counts:', error);
      setError('حدث خطأ في جلب البيانات');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
    
    // تحديث الأعداد كل 30 ثانية
    const interval = setInterval(fetchCounts, 30000);
    
    return () => clearInterval(interval);
  }, [fetchCounts]);

  // دالة لتحديث البيانات يدوياً
  const refresh = useCallback(() => {
    setLoading(true);
    fetchCounts();
  }, [fetchCounts]);

  return { counts, loading, error, refresh };
} 