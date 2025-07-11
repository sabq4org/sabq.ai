/**
 * خوارزمية Graph-based للتوصيات
 * Graph-based Recommendation Algorithm
 */

import { PrismaClient } from '@prisma/client';
import { RecommendationItem, RecommendationRequest } from '../recommendation-engine';

const prisma = new PrismaClient();

export interface GraphNode {
  id: string;
  type: 'user' | 'article';
  weight: number;
  connections: Map<string, number>;
}

export interface GraphEdge {
  from: string;
  to: string;
  weight: number;
  type: 'like' | 'share' | 'comment' | 'read';
}

export interface GraphPath {
  nodes: string[];
  totalWeight: number;
  pathType: string;
}

/**
 * محرك التوصيات المبني على الرسم البياني
 */
export class GraphBasedRecommendationEngine {
  private static instance: GraphBasedRecommendationEngine;
  private graph: Map<string, GraphNode> = new Map();
  private graphLastUpdated: number = 0;
  private readonly GRAPH_TTL = 30 * 60 * 1000; // 30 دقيقة

  public static getInstance(): GraphBasedRecommendationEngine {
    if (!GraphBasedRecommendationEngine.instance) {
      GraphBasedRecommendationEngine.instance = new GraphBasedRecommendationEngine();
    }
    return GraphBasedRecommendationEngine.instance;
  }

  /**
   * الحصول على التوصيات المبنية على الرسم البياني
   */
  async getGraphBasedRecommendations(request: RecommendationRequest): Promise<RecommendationItem[]> {
    const { userId, limit = 10, excludeArticleIds = [] } = request;

    if (!userId) {
      return [];
    }

    // تحديث الرسم البياني إذا لزم الأمر
    await this.updateGraphIfNeeded();

    // العثور على المقالات المقترحة
    const recommendations = await this.findRecommendationsForUser(userId, excludeArticleIds, limit);

    return recommendations;
  }

  /**
   * بناء الرسم البياني من البيانات
   */
  private async buildGraph(): Promise<void> {
    console.log('بناء الرسم البياني للتوصيات...');
    
    this.graph.clear();

    // 1. جلب جميع التفاعلات
    const interactions = await prisma.analyticsEvent.findMany({
      where: {
        event_type: { in: ['like', 'share', 'comment', 'reading_time'] },
        article_id: { not: null },
        user_id: { not: null }
      },
      select: {
        user_id: true,
        article_id: true,
        event_type: true,
        timestamp: true
      },
      orderBy: { timestamp: 'desc' },
      take: 100000 // آخر 100k تفاعل
    });

    // 2. إنشاء العقد
    const userNodes = new Set<string>();
    const articleNodes = new Set<string>();

    interactions.forEach(interaction => {
      userNodes.add(interaction.user_id!);
      articleNodes.add(interaction.article_id!);
    });

    // إنشاء عقد المستخدمين
    userNodes.forEach(userId => {
      this.graph.set(userId, {
        id: userId,
        type: 'user',
        weight: 1.0,
        connections: new Map()
      });
    });

    // إنشاء عقد المقالات
    articleNodes.forEach(articleId => {
      this.graph.set(articleId, {
        id: articleId,
        type: 'article',
        weight: 1.0,
        connections: new Map()
      });
    });

    // 3. إنشاء الروابط
    interactions.forEach(interaction => {
      const userId = interaction.user_id!;
      const articleId = interaction.article_id!;
      const eventWeight = this.getEventWeight(interaction.event_type);

      // رابط من المستخدم إلى المقال
      const userNode = this.graph.get(userId);
      if (userNode) {
        const currentWeight = userNode.connections.get(articleId) || 0;
        userNode.connections.set(articleId, currentWeight + eventWeight);
      }

      // رابط من المقال إلى المستخدم
      const articleNode = this.graph.get(articleId);
      if (articleNode) {
        const currentWeight = articleNode.connections.get(userId) || 0;
        articleNode.connections.set(userId, currentWeight + eventWeight);
      }
    });

    // 4. حساب أوزان العقد بناءً على الروابط
    this.calculateNodeWeights();

    this.graphLastUpdated = Date.now();
    console.log(`تم بناء الرسم البياني: ${userNodes.size} مستخدم، ${articleNodes.size} مقال`);
  }

  /**
   * تحديث الرسم البياني إذا لزم الأمر
   */
  private async updateGraphIfNeeded(): Promise<void> {
    const now = Date.now();
    if (now - this.graphLastUpdated > this.GRAPH_TTL) {
      await this.buildGraph();
    }
  }

  /**
   * العثور على التوصيات لمستخدم معين
   */
  private async findRecommendationsForUser(
    userId: string,
    excludeArticleIds: string[],
    limit: number
  ): Promise<RecommendationItem[]> {
    const userNode = this.graph.get(userId);
    if (!userNode) {
      return [];
    }

    // 1. جلب المقالات المرتبطة مباشرة
    const directlyConnectedArticles = new Set<string>();
    userNode.connections.forEach((weight, nodeId) => {
      const node = this.graph.get(nodeId);
      if (node && node.type === 'article') {
        directlyConnectedArticles.add(nodeId);
      }
    });

    // 2. العثور على المقالات المقترحة عبر المسارات
    const candidateArticles = await this.findCandidateArticlesViaPaths(
      userId,
      directlyConnectedArticles,
      excludeArticleIds
    );

    // 3. حساب النقاط وترتيب النتائج
    const scoredRecommendations = await this.scoreAndRankCandidates(
      candidateArticles,
      userId
    );

    return scoredRecommendations.slice(0, limit);
  }

  /**
   * العثور على المقالات المرشحة عبر المسارات
   */
  private async findCandidateArticlesViaPaths(
    userId: string,
    directlyConnected: Set<string>,
    excludeArticleIds: string[]
  ): Promise<Map<string, GraphPath[]>> {
    const candidateArticles = new Map<string, GraphPath[]>();

    // 1. مسارات من الدرجة الثانية: مستخدم → مقال → مستخدم → مقال
    await this.findSecondDegreePaths(userId, directlyConnected, excludeArticleIds, candidateArticles);

    // 2. مسارات من الدرجة الثالثة: مستخدم → مقال → مستخدم → مقال → مستخدم → مقال
    await this.findThirdDegreePaths(userId, directlyConnected, excludeArticleIds, candidateArticles);

    return candidateArticles;
  }

  /**
   * العثور على مسارات الدرجة الثانية
   */
  private async findSecondDegreePaths(
    userId: string,
    directlyConnected: Set<string>,
    excludeArticleIds: string[],
    candidateArticles: Map<string, GraphPath[]>
  ): Promise<void> {
    const userNode = this.graph.get(userId);
    if (!userNode) return;

    // للمقالات المرتبطة مباشرة
    userNode.connections.forEach((weight1, articleId) => {
      if (directlyConnected.has(articleId)) {
        const articleNode = this.graph.get(articleId);
        if (!articleNode) return;

        // للمستخدمين المرتبطين بهذا المقال
        articleNode.connections.forEach((weight2, otherUserId) => {
          if (otherUserId !== userId) {
            const otherUserNode = this.graph.get(otherUserId);
            if (!otherUserNode) return;

            // للمقالات المرتبطة بالمستخدم الآخر
            otherUserNode.connections.forEach((weight3, candidateArticleId) => {
              const candidateNode = this.graph.get(candidateArticleId);
              if (candidateNode && 
                  candidateNode.type === 'article' && 
                  !directlyConnected.has(candidateArticleId) &&
                  !excludeArticleIds.includes(candidateArticleId)) {
                
                const path: GraphPath = {
                  nodes: [userId, articleId, otherUserId, candidateArticleId],
                  totalWeight: weight1 * weight2 * weight3,
                  pathType: 'second_degree'
                };

                if (!candidateArticles.has(candidateArticleId)) {
                  candidateArticles.set(candidateArticleId, []);
                }
                candidateArticles.get(candidateArticleId)!.push(path);
              }
            });
          }
        });
      }
    });
  }

  /**
   * العثور على مسارات الدرجة الثالثة
   */
  private async findThirdDegreePaths(
    userId: string,
    directlyConnected: Set<string>,
    excludeArticleIds: string[],
    candidateArticles: Map<string, GraphPath[]>
  ): Promise<void> {
    // تطبيق مشابه للدرجة الثانية ولكن مع مسار أطول
    // تم تبسيطه لتجنب التعقيد المفرط
    const userNode = this.graph.get(userId);
    if (!userNode) return;

    // البحث في المسارات الأطول (محدود لتجنب الأداء البطيء)
    const visitedNodes = new Set<string>();
    const maxDepth = 3;

    this.explorePathsRecursively(
      userId,
      userId,
      [],
      0,
      maxDepth,
      visitedNodes,
      directlyConnected,
      excludeArticleIds,
      candidateArticles
    );
  }

  /**
   * استكشاف المسارات بشكل تكراري
   */
  private explorePathsRecursively(
    originalUserId: string,
    currentNodeId: string,
    currentPath: string[],
    currentDepth: number,
    maxDepth: number,
    visitedNodes: Set<string>,
    directlyConnected: Set<string>,
    excludeArticleIds: string[],
    candidateArticles: Map<string, GraphPath[]>
  ): void {
    if (currentDepth >= maxDepth) return;

    const currentNode = this.graph.get(currentNodeId);
    if (!currentNode || visitedNodes.has(currentNodeId)) return;

    visitedNodes.add(currentNodeId);
    const newPath = [...currentPath, currentNodeId];

    // إذا وصلنا لمقال مرشح
    if (currentNode.type === 'article' && 
        currentDepth > 1 && 
        currentNodeId !== originalUserId &&
        !directlyConnected.has(currentNodeId) &&
        !excludeArticleIds.includes(currentNodeId)) {
      
      const totalWeight = this.calculatePathWeight(newPath);
      const path: GraphPath = {
        nodes: newPath,
        totalWeight,
        pathType: `depth_${currentDepth}`
      };

      if (!candidateArticles.has(currentNodeId)) {
        candidateArticles.set(currentNodeId, []);
      }
      candidateArticles.get(currentNodeId)!.push(path);
    }

    // استكشاف الروابط التالية
    currentNode.connections.forEach((weight, nextNodeId) => {
      if (!visitedNodes.has(nextNodeId)) {
        this.explorePathsRecursively(
          originalUserId,
          nextNodeId,
          newPath,
          currentDepth + 1,
          maxDepth,
          new Set(visitedNodes),
          directlyConnected,
          excludeArticleIds,
          candidateArticles
        );
      }
    });
  }

  /**
   * حساب وزن المسار
   */
  private calculatePathWeight(path: string[]): number {
    let totalWeight = 1.0;
    
    for (let i = 0; i < path.length - 1; i++) {
      const fromNode = this.graph.get(path[i]);
      const toNode = this.graph.get(path[i + 1]);
      
      if (fromNode && toNode) {
        const edgeWeight = fromNode.connections.get(path[i + 1]) || 0;
        totalWeight *= edgeWeight;
      }
    }

    // تطبيق تخفيض للمسارات الأطول
    const pathLength = path.length;
    const lengthPenalty = Math.pow(0.8, pathLength - 2);
    
    return totalWeight * lengthPenalty;
  }

  /**
   * تسجيل وترتيب المرشحين
   */
  private async scoreAndRankCandidates(
    candidateArticles: Map<string, GraphPath[]>,
    userId: string
  ): Promise<RecommendationItem[]> {
    const recommendations: RecommendationItem[] = [];

    // جلب تفاصيل المقالات
    const articleIds = Array.from(candidateArticles.keys());
    const articles = await prisma.article.findMany({
      where: {
        id: { in: articleIds },
        status: 'published'
      },
      include: {
        category: true
      }
    });

    for (const article of articles) {
      const paths = candidateArticles.get(article.id) || [];
      
      // حساب النقاط من جميع المسارات
      let totalScore = 0;
      let bestPath: GraphPath | null = null;
      
      paths.forEach(path => {
        totalScore += path.totalWeight;
        if (!bestPath || path.totalWeight > bestPath.totalWeight) {
          bestPath = path;
        }
      });

      // متوسط النقاط
      const averageScore = totalScore / paths.length;
      
      // إضافة عوامل إضافية
      const recencyBonus = this.calculateRecencyBonus(article.published_at);
      const popularityBonus = this.calculatePopularityBonus(article.view_count, article.like_count);
      
      const finalScore = averageScore + recencyBonus + popularityBonus;

      recommendations.push({
        article: {
          id: article.id,
          title: article.title,
          slug: article.slug,
          summary: article.summary,
          featured_image: article.featured_image,
          category_id: article.category_id,
          published_at: article.published_at,
          view_count: article.view_count,
          like_count: article.like_count,
          reading_time: article.reading_time,
          tags: article.tags
        },
        score: finalScore,
        reason_type: 'graph_connection',
        reason_explanation: this.generatePathExplanation(bestPath, paths.length),
        algorithm_type: 'graph',
        context_data: {
          pathsCount: paths.length,
          bestPathWeight: bestPath?.totalWeight || 0,
          averagePathWeight: averageScore,
          bestPath: bestPath?.nodes || []
        }
      });
    }

    return recommendations.sort((a, b) => b.score - a.score);
  }

  /**
   * حساب أوزان العقد
   */
  private calculateNodeWeights(): void {
    this.graph.forEach((node, nodeId) => {
      let totalWeight = 0;
      let connectionCount = 0;

      node.connections.forEach(weight => {
        totalWeight += weight;
        connectionCount++;
      });

      // وزن العقدة = متوسط وزن الروابط × عدد الروابط
      node.weight = connectionCount > 0 ? (totalWeight / connectionCount) * Math.log(connectionCount + 1) : 0;
    });
  }

  /**
   * وزن الأحداث
   */
  private getEventWeight(eventType: string): number {
    const weights: Record<string, number> = {
      'like': 1.0,
      'share': 0.9,
      'comment': 0.8,
      'reading_time': 0.6
    };
    return weights[eventType] || 0.1;
  }

  /**
   * حساب مكافأة الحداثة
   */
  private calculateRecencyBonus(publishedAt?: Date): number {
    if (!publishedAt) return 0;
    
    const daysSincePublished = (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24);
    return Math.max(0, 0.1 * (1 - daysSincePublished / 30));
  }

  /**
   * حساب مكافأة الشعبية
   */
  private calculatePopularityBonus(viewCount: number, likeCount: number): number {
    return Math.log(viewCount + 1) * 0.01 + Math.log(likeCount + 1) * 0.02;
  }

  /**
   * إنشاء شرح للمسار
   */
  private generatePathExplanation(bestPath: GraphPath | null, pathsCount: number): string {
    if (!bestPath) return 'مقترح عبر شبكة التفاعلات';

    const pathLength = bestPath.nodes.length;
    
    if (pathLength === 4) {
      return `مستخدمون قرأوا نفس المقالات التي تحبها أعجبهم هذا المحتوى`;
    } else if (pathLength > 4) {
      return `مقترح عبر شبكة تفاعلات معقدة (${pathsCount} مسار)`;
    }
    
    return `مقترح عبر شبكة التفاعلات (${pathsCount} مسار)`;
  }

  /**
   * تحليل الرسم البياني
   */
  async analyzeGraph(): Promise<{
    totalNodes: number;
    totalEdges: number;
    userNodes: number;
    articleNodes: number;
    averageConnections: number;
    topConnectedNodes: Array<{ id: string; type: string; connections: number }>;
  }> {
    await this.updateGraphIfNeeded();

    let totalEdges = 0;
    let userNodes = 0;
    let articleNodes = 0;
    const nodeConnections: Array<{ id: string; type: string; connections: number }> = [];

    this.graph.forEach((node, nodeId) => {
      if (node.type === 'user') {
        userNodes++;
      } else {
        articleNodes++;
      }

      const connections = node.connections.size;
      totalEdges += connections;
      
      nodeConnections.push({
        id: nodeId,
        type: node.type,
        connections
      });
    });

    const averageConnections = this.graph.size > 0 ? totalEdges / this.graph.size : 0;
    const topConnectedNodes = nodeConnections
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 10);

    return {
      totalNodes: this.graph.size,
      totalEdges: totalEdges / 2, // كل رابط محسوب مرتين
      userNodes,
      articleNodes,
      averageConnections,
      topConnectedNodes
    };
  }

  /**
   * مسح الرسم البياني
   */
  clearGraph(): void {
    this.graph.clear();
    this.graphLastUpdated = 0;
  }

  /**
   * حفظ الرسم البياني (للتطوير والاختبار)
   */
  exportGraph(): any {
    const nodes: any[] = [];
    const edges: any[] = [];

    this.graph.forEach((node, nodeId) => {
      nodes.push({
        id: nodeId,
        type: node.type,
        weight: node.weight
      });

      node.connections.forEach((weight, connectedNodeId) => {
        edges.push({
          from: nodeId,
          to: connectedNodeId,
          weight
        });
      });
    });

    return { nodes, edges };
  }
}

export const graphBasedRecommendationEngine = GraphBasedRecommendationEngine.getInstance(); 