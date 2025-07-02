'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { SelectContent, SelectItem, SelectTrigger, SelectValue, RadixSelect } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Eye,
  Palette,
  Layout,
  Calendar,
  Target,
  Save,
  RotateCcw,
  TrendingUp,
  Grid3X3,
  CheckCircle,
  XCircle,
  Sparkles,
  Code,
  Power,
  PowerOff,
  ArrowUp,
  ArrowDown,
  Clock,
  FileText,
  X,
  ExternalLink
} from 'lucide-react';
import { useDarkModeContext } from '@/contexts/DarkModeContext';
import { toast } from 'react-hot-toast';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SmartBlock {
  id: string;
  name: string;
  position: 'topBanner' | 'afterHighlights' | 'afterCards' | 'beforePersonalization' | 'beforeFooter';
  type: 'smart' | 'custom' | 'html';
  status: 'active' | 'inactive' | 'scheduled';
  displayType: 'grid' | 'cards' | 'horizontal' | 'gallery' | 'list' | 'hero-slider' | 'magazine' | 'headline' | 'image-left' | 'carousel';
  keywords?: string[];
  category?: string;
  articlesCount: number;
  theme: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
  };
  customHtml?: string;
  schedule?: {
    startDate: string;
    endDate: string;
    isAlwaysActive: boolean;
  };
  order: number;
  createdAt: string;
  updatedAt: string;
}

const POSITIONS = [
  { value: 'topBanner', label: 'أعلى الصفحة (أسفل الهيدر)', description: 'يظهر في أعلى الصفحة مباشرة', icon: '🔝' },
  { value: 'afterHighlights', label: 'بعد الأخبار المميزة', description: 'بين الأخبار المميزة والبطاقات', icon: '⭐' },
  { value: 'afterCards', label: 'بعد البطاقات', description: 'بين البطاقات والمحتوى الذكي', icon: '🎴' },
  { value: 'beforePersonalization', label: 'قبل المحتوى المخصص', description: 'قبل قسم "محتوى مخصص لك"', icon: '🎯' },
  { value: 'beforeFooter', label: 'قبل التذييل', description: 'في أسفل الصفحة قبل الفوتر', icon: '🔚' }
];

const displayTypes = [
  { value: 'cards', label: 'بطاقات شبكية', icon: '🎴', color: 'text-purple-500', description: 'شبكة من البطاقات بمقاس موحد' },
  { value: 'carousel', label: 'كاروسيل', icon: '🎠', color: 'text-green-500', description: 'تمرير أفقي للمحتوى' },
  { value: 'headline', label: 'قائمة عناوين', icon: '📰', color: 'text-gray-500', description: 'قائمة نصوص فقط بعناوين المقالات' },
  { value: 'image-left', label: 'صورة يسار', icon: '🖼️', color: 'text-orange-500', description: 'صورة مصغرة بجوار عنوان المقال' },
  { value: 'hero-slider', label: 'سلايدر رئيسي', icon: '🎬', color: 'text-red-500', description: 'سلايدر كبير مع صور وعناوين' },
  { value: 'magazine', label: 'تخطيط مجلة', icon: '📖', color: 'text-indigo-500', description: 'تخطيط مجلة احترافي' },
  { value: 'grid', label: 'شبكة', icon: '⚏', color: 'text-blue-500', description: 'شبكة بطاقات كلاسيكية' },
  { value: 'list', label: 'قائمة', icon: '📋', color: 'text-gray-500', description: 'قائمة عمودية بسيطة' },
  { value: 'horizontal', label: 'أفقي', icon: '↔️', color: 'text-green-500', description: 'شريط أفقي قابل للتمرير' },
  { value: 'gallery', label: 'معرض', icon: '🖼️', color: 'text-orange-500', description: 'معرض صور بدون نصوص' }
];

const BLOCK_TYPES = [
  { value: 'smart', label: 'بلوك ذكي', description: 'يعرض المحتوى بناءً على كلمات مفتاحية', icon: Sparkles, color: 'text-purple-500' },
  { value: 'custom', label: 'بلوك مخصص', description: 'اختيار يدوي للمقالات', icon: Target, color: 'text-blue-500' },
  { value: 'html', label: 'بلوك HTML', description: 'كود HTML مخصص', icon: Code, color: 'text-green-500' }
];

const EnhancedStatsCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  bgGradient,
  iconColor,
  trend,
  trendValue,
  darkMode,
  loading
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: any;
  bgGradient: string;
  iconColor: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  darkMode: boolean;
  loading: boolean;
}) => {
  return (
    <div className={`rounded-2xl p-4 sm:p-6 shadow-sm border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
      darkMode 
        ? 'bg-gray-800 border-gray-700' 
        : 'bg-white border-gray-100'
    }`}>
      <div className="flex items-center gap-3 sm:gap-4">
        <div className={`w-12 h-12 sm:w-14 sm:h-14 ${bgGradient} rounded-2xl flex items-center justify-center shadow-lg`}>
          <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${iconColor}`} />
        </div>
        <div className="flex-1">
          <p className={`text-xs sm:text-sm mb-1 transition-colors duration-300 ${
            darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>{title}</p>
          <div className="flex items-baseline gap-1 sm:gap-2">
            <span className={`text-lg sm:text-2xl font-bold transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-gray-800'
            }`}>{loading ? '...' : value}</span>
            <span className={`text-xs sm:text-sm transition-colors duration-300 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>{subtitle}</span>
          </div>
          {trend && trendValue && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              <TrendingUp className={`w-3 h-3 ${trend === 'down' ? 'rotate-180' : ''}`} />
              <span>{trendValue}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default function SmartBlocksPage() {
  const { darkMode } = useDarkModeContext();
  const [blocks, setBlocks] = useState<SmartBlock[]>([]);
  const [selectedBlock, setSelectedBlock] = useState<SmartBlock | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState<SmartBlock | null>(null);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [statusChangeBlock, setStatusChangeBlock] = useState<SmartBlock | null>(null);

  // نموذج البلوك الجديد
  const [newBlock, setNewBlock] = useState<Partial<SmartBlock>>({
    name: '',
    position: 'afterCards',
    type: 'smart',
    status: 'active',
    displayType: 'grid',
    keywords: [],
    category: '',
    articlesCount: 6,
    theme: {
      primaryColor: '#00BFA6',
      backgroundColor: darkMode ? '#1f2937' : '#ffffff',
      textColor: darkMode ? '#f3f4f6' : '#1a1a1a'
    },
    customHtml: '',
    schedule: {
      startDate: '',
      endDate: '',
      isAlwaysActive: false
    }
  });

  useEffect(() => {
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/smart-blocks');
      if (response.ok) {
        const data = await response.json();
        setBlocks(data);
      }
    } catch (error) {
      console.error('خطأ في جلب البلوكات:', error);
      toast.error('فشل في تحميل البلوكات');
    } finally {
      setLoading(false);
    }
  };

  const moveBlockUp = async (blockId: string) => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === 0) return;

    const newBlocks = [...blocks];
    [newBlocks[blockIndex], newBlocks[blockIndex - 1]] = [newBlocks[blockIndex - 1], newBlocks[blockIndex]];
    
    // تحديث ترتيب البلوكات
    const updatedBlocks = newBlocks.map((block, index) => ({
      ...block,
      order: index + 1
    }));

    setBlocks(updatedBlocks);

    try {
      await fetch('/api/smart-blocks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks: updatedBlocks })
      });
      toast.success('تم تحديث ترتيب البلوكات بنجاح');
    } catch (error) {
      toast.error('فشل في حفظ الترتيب الجديد');
    }
  };

  const moveBlockDown = async (blockId: string) => {
    const blockIndex = blocks.findIndex(b => b.id === blockId);
    if (blockIndex === blocks.length - 1) return;

    const newBlocks = [...blocks];
    [newBlocks[blockIndex], newBlocks[blockIndex + 1]] = [newBlocks[blockIndex + 1], newBlocks[blockIndex]];
    
    // تحديث ترتيب البلوكات
    const updatedBlocks = newBlocks.map((block, index) => ({
      ...block,
      order: index + 1
    }));

    setBlocks(updatedBlocks);

    try {
      await fetch('/api/smart-blocks/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blocks: updatedBlocks })
      });
      toast.success('تم تحديث ترتيب البلوكات بنجاح');
    } catch (error) {
      toast.error('فشل في حفظ الترتيب الجديد');
    }
  };

  const toggleBlockStatus = async (blockId: string) => {
    const block = blocks.find(b => b.id === blockId);
    if (!block) return;
    
    setStatusChangeBlock(block);
    setShowStatusConfirm(true);
  };

  const confirmStatusChange = async () => {
    if (!statusChangeBlock) return;
    
    try {
      const newStatus = statusChangeBlock.status === 'active' ? 'inactive' : 'active';
      console.log(`[SmartBlocks Dashboard] تغيير حالة البلوك ${statusChangeBlock.id} إلى ${newStatus}`);
      
      const response = await fetch(`/api/smart-blocks/${statusChangeBlock.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (response.ok) {
        const updatedBlock = await response.json();
        console.log('[SmartBlocks Dashboard] تم تحديث حالة البلوك:', updatedBlock);
        
        setBlocks(prevBlocks => 
          prevBlocks.map(block => 
            block.id === updatedBlock.id ? updatedBlock : block
          )
        );
        
        toast.success(newStatus === 'active' ? 'تم تفعيل البلوك بنجاح!' : 'تم إيقاف البلوك بنجاح!');
      } else {
        const errorData = await response.json();
        console.error('[SmartBlocks Dashboard] خطأ في تحديث حالة البلوك:', errorData);
        toast.error(errorData.error || 'فشل في تحديث حالة البلوك');
      }
    } catch (error) {
      console.error('[SmartBlocks Dashboard] خطأ في تحديث حالة البلوك:', error);
      toast.error('حدث خطأ في تحديث حالة البلوك');
    } finally {
      setShowStatusConfirm(false);
      setStatusChangeBlock(null);
    }
  };

  const saveBlock = async () => {
    try {
      // التحقق من صحة البيانات
      if (!newBlock.name?.trim()) {
        toast.error('يرجى إدخال عنوان البلوك');
        return;
      }

      const blockData = {
        ...newBlock,
        id: isEditing ? selectedBlock?.id : `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        order: isEditing ? selectedBlock?.order : blocks.length + 1,
        createdAt: isEditing ? selectedBlock?.createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      console.log('[SmartBlocks Dashboard] حفظ البلوك:', {
        isEditing,
        blockId: blockData.id,
        position: blockData.position,
        oldPosition: selectedBlock?.position,
        fullData: blockData
      });

      const url = isEditing ? `/api/smart-blocks/${selectedBlock?.id}` : '/api/smart-blocks';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(blockData)
      });

      if (response.ok) {
        const savedBlock = await response.json();
        console.log('[SmartBlocks Dashboard] البلوك المحفوظ:', savedBlock);
        
        if (isEditing) {
          setBlocks(blocks.map(b => b.id === savedBlock.id ? savedBlock : b));
          toast.success(
            <div>
              <p className="font-bold">✅ تم تحديث البلوك بنجاح!</p>
              <p className="text-sm mt-1">الموضع: {getPositionLabel(savedBlock.position)}</p>
              <p className="text-xs mt-2 text-gray-500">قد تحتاج لتحديث الصفحة الرئيسية لرؤية التغييرات</p>
            </div>,
            { duration: 5000 }
          );
        } else {
          setBlocks([...blocks, savedBlock]);
          toast.success(
            <div>
              <p className="font-bold">✅ تم إنشاء البلوك بنجاح!</p>
              <p className="text-sm mt-1">الموضع: {getPositionLabel(savedBlock.position)}</p>
              <p className="text-xs mt-2 text-gray-500">افتح الصفحة الرئيسية في تبويب جديد لرؤية البلوك</p>
            </div>,
            { duration: 5000 }
          );
        }

        // إعادة جلب البيانات للتأكد من التحديث
        setTimeout(() => {
          fetchBlocks();
        }, 500);

        resetForm();
        setShowCreateForm(false);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'فشل في الحفظ');
      }
    } catch (error) {
      console.error('خطأ في حفظ البلوك:', error);
      toast.error(
        <div>
          <p className="font-bold">❌ فشل في حفظ البلوك</p>
          <p className="text-sm mt-1">{error instanceof Error ? error.message : 'يرجى المحاولة مرة أخرى'}</p>
        </div>
      );
    }
  };

  const deleteBlock = async (blockId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا البلوك؟')) return;

    try {
      const response = await fetch(`/api/smart-blocks/${blockId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setBlocks(blocks.filter(b => b.id !== blockId));
        toast.success('تم حذف البلوك بنجاح');
      }
    } catch (error) {
      toast.error('فشل في حذف البلوك');
    }
  };

  const editBlock = (block: SmartBlock) => {
    console.log('[SmartBlocks Dashboard] تحرير البلوك:', block);
    setEditingBlock(block);
    setShowEditModal(true);
  };

  const editBlockInline = (block: SmartBlock) => {
    console.log('[SmartBlocks Dashboard] تحرير البلوك في النموذج الكامل:', block);
    setSelectedBlock(block);
    setNewBlock(block);
    setIsEditing(true);
    setShowCreateForm(true);
    
    // التمرير إلى النموذج بعد فتحه
    setTimeout(() => {
      const formElement = document.getElementById('smart-block-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const saveQuickEdit = async () => {
    if (!editingBlock) return;

    try {
      console.log('[SmartBlocks Dashboard] حفظ التعديلات السريعة:', editingBlock);
      
      const response = await fetch(`/api/smart-blocks/${editingBlock.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingBlock),
      });
      
      if (response.ok) {
        const updatedBlock = await response.json();
        console.log('[SmartBlocks Dashboard] تم حفظ البلوك:', updatedBlock);
        
        setBlocks(prevBlocks => 
          prevBlocks.map(block => 
            block.id === updatedBlock.id ? updatedBlock : block
          )
        );
        
        toast.success('تم حفظ التعديلات بنجاح!');
        setShowEditModal(false);
        setEditingBlock(null);
      } else {
        const errorData = await response.json();
        console.error('[SmartBlocks Dashboard] خطأ في حفظ البلوك:', errorData);
        toast.error(errorData.error || 'فشل في حفظ التعديلات');
      }
    } catch (error) {
      console.error('[SmartBlocks Dashboard] خطأ في حفظ البلوك:', error);
      toast.error('حدث خطأ في حفظ التعديلات');
    }
  };

  const resetForm = () => {
    setNewBlock({
      name: '',
      position: 'afterCards',
      type: 'smart',
      status: 'active',
      displayType: 'grid',
      keywords: [],
      category: '',
      articlesCount: 6,
      theme: {
        primaryColor: '#00BFA6',
        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
        textColor: darkMode ? '#f3f4f6' : '#1a1a1a'
      },
      customHtml: '',
      schedule: {
        startDate: '',
        endDate: '',
        isAlwaysActive: false
      }
    });
    setSelectedBlock(null);
    setIsEditing(false);
    setShowPreview(false);
    setCurrentKeyword('');
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'مفعل', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400', icon: CheckCircle },
      inactive: { label: 'معطل', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400', icon: XCircle },
      scheduled: { label: 'مجدول', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400', icon: Clock }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.color} flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getPositionLabel = (position: string) => {
    const pos = POSITIONS.find(p => p.value === position);
    return pos ? `${pos.icon} ${pos.label}` : position;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>جاري تحميل البلوكات...</p>
        </div>
      </div>
    );
  }

  // التبويبات
  const statusTabs = [
    { 
      id: 'all', 
      name: 'جميع البلوكات', 
      count: blocks.length,
      icon: <Grid3X3 className="w-5 h-5" />
    },
    { 
      id: 'active', 
      name: 'مفعل', 
      count: blocks.filter(item => item.status === 'active').length,
      icon: <CheckCircle className="w-5 h-5" />
    },
    { 
      id: 'inactive', 
      name: 'غير مفعل', 
      count: blocks.filter(item => item.status === 'inactive').length,
      icon: <XCircle className="w-5 h-5" />
    },
    { 
      id: 'smart', 
      name: 'بلوكات ذكية', 
      count: blocks.filter(item => item.type === 'smart').length,
      icon: <Sparkles className="w-5 h-5" />
    },
    { 
      id: 'html', 
      name: 'بلوكات HTML', 
      count: blocks.filter(item => item.type === 'html').length,
      icon: <Code className="w-5 h-5" />
    }
  ];

  // فلترة البلوكات حسب التبويب المحدد
  const filteredBlocks = blocks.filter(block => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return block.status === 'active';
    if (activeTab === 'inactive') return block.status === 'inactive';
    if (activeTab === 'smart') return block.type === 'smart';
    if (activeTab === 'html') return block.type === 'html';
    return true;
  });

  // ترتيب البلوكات: الأحدث أولاً (حسب تاريخ الإنشاء أو الترتيب اليدوي)
  const sortedBlocks = filteredBlocks.sort((a, b) => {
    if (a.order && b.order) {
      return a.order - b.order;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className={`p-4 sm:p-6 lg:p-8 transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`} dir="rtl">
      {/* عنوان وتعريف الصفحة */}
      <div className="mb-6 sm:mb-8">
        <h1 className={`text-2xl sm:text-3xl font-bold mb-2 transition-colors duration-300 ${
          darkMode ? 'text-white' : 'text-gray-800'
        }`}>مركز إدارة البلوكات الذكية</h1>
        <p className={`text-sm sm:text-base transition-colors duration-300 ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>منصة متكاملة لإنشاء وإدارة البلوكات التفاعلية والمحتوى الديناميكي في الصفحة الرئيسية</p>
      </div>

      {/* قسم النظام الذكي */}
      <div className="mb-6 sm:mb-8">
        <div className={`rounded-2xl p-4 sm:p-6 border transition-colors duration-300 ${
          darkMode 
            ? 'bg-gradient-to-r from-teal-900/30 to-cyan-900/30 border-teal-700' 
            : 'bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-100'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
              <Grid3X3 className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <h2 className={`text-lg sm:text-xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>نظام البلوكات الذكية المتقدم</h2>
              <p className={`text-xs sm:text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>أدوات قوية لإنشاء محتوى تفاعلي وديناميكي يتكيف مع اهتمامات القراء</p>
            </div>
          </div>
        </div>
      </div>

      {/* بطاقات الإحصائيات المحسّنة */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <EnhancedStatsCard
          title="إجمالي البلوكات"
          value={blocks.length}
          subtitle="بلوك"
          icon={Grid3X3}
          bgGradient="bg-gradient-to-br from-teal-500 to-cyan-600"
          iconColor="text-white"
          trend="up"
          trendValue="+12% هذا الشهر"
          darkMode={darkMode}
          loading={loading}
        />
        <EnhancedStatsCard
          title="البلوكات المفعلة"
          value={blocks.filter(b => b.status === 'active').length}
          subtitle="نشط"
          icon={CheckCircle}
          bgGradient="bg-gradient-to-br from-green-500 to-emerald-600"
          iconColor="text-white"
          trend="up"
          trendValue="+8% هذا الأسبوع"
          darkMode={darkMode}
          loading={loading}
        />
        <EnhancedStatsCard
          title="البلوكات الذكية"
          value={blocks.filter(b => b.type === 'smart').length}
          subtitle="ذكي"
          icon={Sparkles}
          bgGradient="bg-gradient-to-br from-purple-500 to-pink-600"
          iconColor="text-white"
          darkMode={darkMode}
          loading={loading}
        />
        <EnhancedStatsCard
          title="البلوكات المخصصة"
          value={blocks.filter(b => b.type === 'custom').length}
          subtitle="مخصص"
          icon={Target}
          bgGradient="bg-gradient-to-br from-blue-500 to-indigo-600"
          iconColor="text-white"
          darkMode={darkMode}
          loading={loading}
        />
        <EnhancedStatsCard
          title="بلوكات HTML"
          value={blocks.filter(b => b.type === 'html').length}
          subtitle="HTML"
          icon={Code}
          bgGradient="bg-gradient-to-br from-orange-500 to-red-600"
          iconColor="text-white"
          darkMode={darkMode}
          loading={loading}
        />
      </div>

      {/* أزرار التنقل المحسّنة */}
      <div className={`rounded-2xl p-2 shadow-sm border mb-6 sm:mb-8 w-full transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {statusTabs.map((tab) => {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`min-w-[100px] sm:min-w-[120px] lg:w-44 flex flex-col items-center justify-center gap-1 sm:gap-2 py-3 sm:py-4 px-2 sm:px-3 rounded-xl font-medium text-xs sm:text-sm transition-all duration-300 relative ${
                  activeTab === tab.id
                    ? 'bg-teal-500 text-white shadow-md transform scale-105'
                    : darkMode
                      ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className={`transition-transform duration-300 ${activeTab === tab.id ? 'scale-110' : ''}`}>
                  {tab.icon}
                </div>
                <div className="text-center">
                  <div className="whitespace-nowrap">{tab.name}</div>
                </div>
                {tab.count > 0 && (
                  <span className={`absolute top-1 sm:top-2 left-1 sm:left-2 px-1.5 sm:px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id
                      ? 'bg-white text-teal-500'
                      : darkMode
                        ? 'bg-gray-700 text-gray-300'
                        : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* جدول البلوكات المحسن */}
      <div className={`rounded-2xl shadow-sm border overflow-hidden transition-colors duration-300 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-100'
      }`}>
        <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className={`text-lg font-semibold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>البلوكات المُدارة ({sortedBlocks.length})</h2>
              <p className={`text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>إدارة وترتيب البلوكات الذكية في الصفحة الرئيسية</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                {blocks.filter(b => b.status === 'active').length} مفعل
              </Badge>
              <Button
                onClick={() => window.open('/', '_blank')}
                variant="outline"
                className="flex items-center gap-2"
                type="button"
              >
                <ExternalLink className="h-4 w-4" />
                عرض الصفحة الرئيسية
              </Button>
              <Button 
                onClick={() => {
                  setShowCreateForm(true);
                  // التمرير إلى النموذج بعد فتحه
                  setTimeout(() => {
                    const formElement = document.getElementById('smart-block-form');
                    if (formElement) {
                      formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }, 100);
                }} 
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-md transition-all duration-200 hover:shadow-lg"
                type="button"
              >
                <Plus className="h-5 w-5" />
                إضافة بلوك جديد
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-0">
          {sortedBlocks.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-6xl mb-4">🧩</div>
              <h3 className={`text-xl font-semibold mb-2 transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-gray-800'
              }`}>لا توجد بلوكات حتى الآن</h3>
              <p className={`transition-colors duration-300 mb-6 ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>ابدأ بإنشاء أول بلوك ذكي لتخصيص الصفحة الرئيسية</p>
              <Button onClick={() => {
                setShowCreateForm(true);
                // التمرير إلى النموذج بعد فتحه
                setTimeout(() => {
                  const formElement = document.getElementById('smart-block-form');
                  if (formElement) {
                    formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 100);
              }} className="flex items-center gap-2 mx-auto">
                <Plus className="h-4 w-4" />
                إنشاء بلوك جديد
              </Button>
            </div>
          ) : (
            sortedBlocks.map((block, index) => (
              <div key={block.id} className={`border-b border-gray-200 dark:border-gray-700 last:border-b-0 transition-all duration-300 ${
                darkMode ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
              }`}>
                <div className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      {/* أزرار الترتيب */}
                      <div className="flex flex-col gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveBlockUp(block.id)}
                          disabled={index === 0}
                          className="h-10 w-10 p-0"
                        >
                          <ArrowUp className="h-5 w-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveBlockDown(block.id)}
                          disabled={index === sortedBlocks.length - 1}
                          className="h-10 w-10 p-0"
                        >
                          <ArrowDown className="h-5 w-5" />
                        </Button>
                      </div>
                      
                      {/* معلومات البلوك */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className={`font-semibold text-lg transition-colors duration-300 ${
                            darkMode ? 'text-white' : 'text-gray-800'
                          }`}>{block.name}</h3>
                          {getStatusBadge(block.status)}
                          <Badge variant="outline" className="text-xs">
                            <span className={displayTypes.find(d => d.value === block.displayType)?.color}>
                              {displayTypes.find(d => d.value === block.displayType)?.icon}
                            </span>
                            <span className="mr-1">
                              {displayTypes.find(d => d.value === block.displayType)?.label}
                            </span>
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {BLOCK_TYPES.find(t => t.value === block.type)?.icon && (
                              React.createElement(BLOCK_TYPES.find(t => t.value === block.type)!.icon, {
                                className: `w-3 h-3 ml-1 ${BLOCK_TYPES.find(t => t.value === block.type)?.color}`
                              })
                            )}
                            {BLOCK_TYPES.find(t => t.value === block.type)?.label}
                          </Badge>
                        </div>
                        
                        <div className={`flex flex-wrap items-center gap-4 text-sm transition-colors duration-300 ${
                          darkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          <span className="flex items-center gap-1">
                            <Layout className="w-4 h-4" />
                            {getPositionLabel(block.position)}
                          </span>
                          {block.keywords && block.keywords.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Target className="w-4 h-4" />
                              {block.keywords.join(', ')}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <FileText className="w-4 h-4" />
                            {block.articlesCount} مقال
                          </span>
                          <span className="flex items-center gap-1">
                            <Palette className="w-4 h-4" />
                            <span 
                              className="w-4 h-4 rounded-full border"
                              style={{ backgroundColor: block.theme.primaryColor }}
                            />
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(block.createdAt).toLocaleDateString('ar-SA')}
                          </span>
                          {block.updatedAt && block.updatedAt !== block.createdAt && (
                            <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                              <Clock className="w-4 h-4" />
                              محدث {new Date(block.updatedAt).toLocaleDateString('ar-SA')}
                            </span>
                          )}
                          {block.schedule && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {block.schedule.isAlwaysActive 
                                ? 'دائم' 
                                : block.schedule.startDate && block.schedule.endDate
                                  ? `${new Date(block.schedule.startDate).toLocaleDateString('ar-SA')} - ${new Date(block.schedule.endDate).toLocaleDateString('ar-SA')}`
                                  : 'غير محدد'
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* الإجراءات */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant={block.status === 'active' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleBlockStatus(block.id)}
                        className={`h-10 px-3 ${
                          block.status === 'active' 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100'
                        }`}
                        title={block.status === 'active' ? 'إيقاف تشغيل البلوك' : 'تشغيل البلوك'}
                      >
                        {block.status === 'active' ? (
                          <>
                            <Power className="h-4 w-4 ml-1" />
                            <span className="hidden sm:inline">مفعل</span>
                          </>
                        ) : (
                          <>
                            <PowerOff className="h-4 w-4 ml-1" />
                            <span className="hidden sm:inline">معطل</span>
                          </>
                        )}
                      </Button>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editBlock(block)}
                          className="h-10 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30"
                          title="تعديل البلوك"
                        >
                          <Edit3 className="h-4 w-4" />
                          <span className="mr-1 hidden lg:inline">تعديل</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteBlock(block.id)}
                          className="h-10 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                          title="حذف البلوك"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="mr-1 hidden lg:inline">حذف</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* نموذج إنشاء البلوك مع المعاينة في جدول واحد */}
      {showCreateForm && (
        <div className="mt-8 relative z-10 transition-all duration-300 transform animate-in fade-in slide-in-from-bottom-4" id="smart-block-form">
          {/* جدول واحد يحتوي على النموذج والمعاينة */}
          <div className={`rounded-2xl shadow-2xl transition-all duration-300 overflow-hidden ring-2 ${
            darkMode 
              ? 'bg-gray-800 border border-gray-700 ring-teal-500/50' 
              : 'bg-white border border-gray-200 ring-teal-500/30'
          }`}>
            {/* رأس الجدول */}
            <div className={`p-6 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={`text-xl font-bold transition-colors duration-300 ${
                    darkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    {isEditing ? 'تعديل البلوك' : 'إنشاء بلوك جديد'}
                  </h2>
                  <p className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    قم بتخصيص البلوك وضبط إعداداته مع معاينة مباشرة
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                  className="h-10 w-10 p-0 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>

            {/* محتوى الجدول: النموذج والمعاينة جنباً إلى جنب */}
            <div className="grid grid-cols-1 lg:grid-cols-2">
              {/* القسم الأيسر: النموذج */}
              <div className={`p-6 space-y-6 ${darkMode ? 'border-l border-gray-700' : 'border-l border-gray-200'} lg:border-l-0 lg:border-r`}>
                {/* المعلومات الأساسية */}
                <div className={`space-y-4 p-4 rounded-lg border ${
                  darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h3 className={`font-semibold text-lg flex items-center gap-2 ${
                    darkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    <FileText className="w-5 h-5" />
                    المعلومات الأساسية
                  </h3>
                  
                  <div>
                    <Label htmlFor="block-name" className="mb-2">عنوان البلوك</Label>
                    <Input
                      id="block-name"
                      value={newBlock.name}
                      onChange={(e) => setNewBlock({ ...newBlock, name: e.target.value })}
                      placeholder="مثال: اليوم الوطني 94"
                      maxLength={50}
                      className={darkMode ? 'bg-gray-800 border-gray-700' : ''}
                    />
                    <p className={`text-xs mt-1 transition-colors duration-300 ${
                      darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {newBlock.name?.length || 0}/50 حرف
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <Label htmlFor="block-position" className="mb-2">موقع العرض</Label>
                      <RadixSelect
                        value={newBlock.position}
                        onValueChange={(value) => setNewBlock({ ...newBlock, position: value as any })}
                      >
                        <SelectTrigger id="block-position" className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} max-h-[300px] overflow-y-auto`}>
                          {POSITIONS.map((pos) => (
                            <SelectItem key={pos.value} value={pos.value} className={darkMode ? 'hover:bg-gray-700' : ''}>
                              <div className="flex items-center gap-2">
                                <span>{pos.icon}</span>
                                <div>
                                  <div className="font-medium">{pos.label}</div>
                                  <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {pos.description}
                                  </div>
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </RadixSelect>
                    </div>

                    <div>
                      <Label htmlFor="block-type" className="mb-2">نوع البلوك</Label>
                      <RadixSelect
                        value={newBlock.type}
                        onValueChange={(value) => setNewBlock({ ...newBlock, type: value as any })}
                      >
                        <SelectTrigger id="block-type" className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                          {BLOCK_TYPES.map((type) => {
                            const Icon = type.icon;
                            return (
                              <SelectItem key={type.value} value={type.value} className={darkMode ? 'hover:bg-gray-700' : ''}>
                                <div className="flex items-center gap-2">
                                  <Icon className={`w-4 h-4 ${type.color}`} />
                                  <div>
                                    <div className="font-medium">{type.label}</div>
                                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {type.description}
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </RadixSelect>
                    </div>
                  </div>

                  {newBlock.type === 'smart' && (
                    <div>
                      <Label htmlFor="block-keyword" className="mb-2">الكلمات المفتاحية</Label>
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            id="block-keyword"
                            value={currentKeyword}
                            onChange={(e) => setCurrentKeyword(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && currentKeyword.trim()) {
                                e.preventDefault();
                                setNewBlock({
                                  ...newBlock,
                                  keywords: [...(newBlock.keywords || []), currentKeyword.trim()]
                                });
                                setCurrentKeyword('');
                              }
                            }}
                            placeholder="اكتب كلمة واضغط Enter"
                            className={darkMode ? 'bg-gray-800 border-gray-700' : ''}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (currentKeyword.trim()) {
                                setNewBlock({
                                  ...newBlock,
                                  keywords: [...(newBlock.keywords || []), currentKeyword.trim()]
                                });
                                setCurrentKeyword('');
                              }
                            }}
                            disabled={!currentKeyword.trim()}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {newBlock.keywords && newBlock.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {newBlock.keywords.map((keyword, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="flex items-center gap-1 px-2 py-1"
                              >
                                <span>{keyword}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setNewBlock({
                                      ...newBlock,
                                      keywords: newBlock.keywords?.filter((_, i) => i !== index)
                                    });
                                  }}
                                  className="ml-1 hover:text-red-500 transition-colors"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {newBlock.type === 'html' && (
                    <div>
                      <Label htmlFor="block-html" className="mb-2">كود HTML</Label>
                      <Textarea
                        id="block-html"
                        value={newBlock.customHtml}
                        onChange={(e) => setNewBlock({ ...newBlock, customHtml: e.target.value })}
                        placeholder="أدخل كود HTML المخصص هنا..."
                        rows={4}
                        className={`font-mono text-sm ${darkMode ? 'bg-gray-800 border-gray-700' : ''}`}
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="block-count" className="mb-2">عدد المقالات</Label>
                      <Input
                        id="block-count"
                        type="number"
                        min="1"
                        max="20"
                        value={newBlock.articlesCount}
                        onChange={(e) => setNewBlock({ ...newBlock, articlesCount: parseInt(e.target.value) || 6 })}
                        className={darkMode ? 'bg-gray-800 border-gray-700' : ''}
                      />
                    </div>

                    <div>
                      <Label htmlFor="block-display" className="mb-2">نوع العرض</Label>
                      <RadixSelect
                        value={newBlock.displayType}
                        onValueChange={(value) => setNewBlock({ ...newBlock, displayType: value as any })}
                      >
                        <SelectTrigger id="block-display" className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                          {displayTypes.map((type) => {
                            return (
                              <SelectItem key={type.value} value={type.value} className={darkMode ? 'hover:bg-gray-700' : ''}>
                                <div className="flex items-center gap-2">
                                  <span className={type.color}>{type.icon}</span>
                                  <span>{type.label}</span>
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </RadixSelect>
                    </div>
                  </div>
                </div>

                {/* إعدادات الألوان */}
                <div className={`space-y-4 p-4 rounded-lg border ${
                  darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h3 className={`font-semibold text-lg flex items-center gap-2 ${
                    darkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    <Palette className="w-5 h-5" />
                    إعدادات الألوان
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={newBlock.theme?.primaryColor}
                        onChange={(e) => setNewBlock({
                          ...newBlock,
                          theme: { ...newBlock.theme!, primaryColor: e.target.value }
                        })}
                        className="w-16 h-10"
                      />
                      <Label className="flex-1">اللون الأساسي</Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={newBlock.theme?.backgroundColor}
                        onChange={(e) => setNewBlock({
                          ...newBlock,
                          theme: { ...newBlock.theme!, backgroundColor: e.target.value }
                        })}
                        className="w-16 h-10"
                      />
                      <Label className="flex-1">لون الخلفية</Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={newBlock.theme?.textColor}
                        onChange={(e) => setNewBlock({
                          ...newBlock,
                          theme: { ...newBlock.theme!, textColor: e.target.value }
                        })}
                        className="w-16 h-10"
                      />
                      <Label className="flex-1">لون النص</Label>
                    </div>
                  </div>
                </div>

                {/* إعدادات التوقيت */}
                <div className={`space-y-4 p-4 rounded-lg border ${
                  darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <h3 className={`font-semibold text-lg flex items-center gap-2 ${
                    darkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    <Clock className="w-5 h-5" />
                    إعدادات التوقيت
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="always-active" className="cursor-pointer">
                        تفعيل دائم
                      </Label>
                      <Switch
                        id="always-active"
                        checked={newBlock.schedule?.isAlwaysActive || false}
                        onCheckedChange={(checked) => setNewBlock({
                          ...newBlock,
                          schedule: {
                            ...newBlock.schedule!,
                            isAlwaysActive: checked,
                            startDate: checked ? '' : newBlock.schedule?.startDate || '',
                            endDate: checked ? '' : newBlock.schedule?.endDate || ''
                          }
                        })}
                      />
                    </div>

                    {!newBlock.schedule?.isAlwaysActive && (
                      <div className="grid grid-cols-1 gap-3">
                        <div>
                          <Label htmlFor="start-date" className="mb-2">تاريخ البداية</Label>
                          <Input
                            id="start-date"
                            type="datetime-local"
                            value={newBlock.schedule?.startDate || ''}
                            onChange={(e) => setNewBlock({
                              ...newBlock,
                              schedule: {
                                ...newBlock.schedule!,
                                startDate: e.target.value
                              }
                            })}
                            className={darkMode ? 'bg-gray-800 border-gray-700' : ''}
                          />
                        </div>

                        <div>
                          <Label htmlFor="end-date" className="mb-2">تاريخ النهاية</Label>
                          <Input
                            id="end-date"
                            type="datetime-local"
                            value={newBlock.schedule?.endDate || ''}
                            onChange={(e) => setNewBlock({
                              ...newBlock,
                              schedule: {
                                ...newBlock.schedule!,
                                endDate: e.target.value
                              }
                            })}
                            min={newBlock.schedule?.startDate || ''}
                            className={darkMode ? 'bg-gray-800 border-gray-700' : ''}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* القسم الأيمن: المعاينة */}
              <div className="p-6">
                <h3 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${
                  darkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  <Eye className="w-5 h-5" />
                  معاينة مباشرة
                </h3>

                {/* معاينة البلوك */}
                <div 
                  className="rounded-lg p-4 transition-all duration-300 shadow-sm"
                  style={{
                    backgroundColor: newBlock.theme?.backgroundColor || '#ffffff',
                    borderColor: newBlock.theme?.primaryColor || '#00BFA6',
                    borderWidth: '1px',
                    borderStyle: 'solid'
                  }}
                >
                  <h4 
                    className="text-lg font-bold mb-3"
                    style={{ color: newBlock.theme?.textColor || '#1a1a1a' }}
                  >
                    {newBlock.name || 'عنوان البلوك'}
                  </h4>

                  {/* معاينة حسب نوع العرض */}
                  {newBlock.displayType === 'grid' && (
                    <div className="grid grid-cols-2 gap-2">
                      {[1, 2, 3, 4].slice(0, Math.min(4, newBlock.articlesCount || 6)).map(i => (
                        <div 
                          key={i} 
                          className="rounded p-2"
                          style={{ 
                            backgroundColor: `${newBlock.theme?.primaryColor}20` || '#00BFA620'
                          }}
                        >
                          <div className="h-16 bg-gray-300 rounded mb-2 animate-pulse"></div>
                          <div className="h-3 bg-gray-300 rounded mb-1 animate-pulse"></div>
                          <div className="h-2 bg-gray-300 rounded w-3/4 animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  )}

                  {newBlock.displayType === 'list' && (
                    <div className="space-y-2">
                      {[1, 2, 3].slice(0, Math.min(3, newBlock.articlesCount || 6)).map(i => (
                        <div 
                          key={i} 
                          className="flex items-center gap-2 p-2 rounded"
                          style={{ 
                            backgroundColor: `${newBlock.theme?.primaryColor}10` || '#00BFA610'
                          }}
                        >
                          <div className="w-12 h-12 bg-gray-300 rounded animate-pulse"></div>
                          <div className="flex-1">
                            <div className="h-3 bg-gray-300 rounded mb-1 animate-pulse"></div>
                            <div className="h-2 bg-gray-300 rounded w-3/4 animate-pulse"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {newBlock.displayType === 'cards' && (
                    <div className="space-y-2">
                      {[1].map(i => (
                        <div 
                          key={i} 
                          className="rounded overflow-hidden shadow"
                          style={{ 
                            backgroundColor: newBlock.theme?.backgroundColor || '#ffffff'
                          }}
                        >
                          <div className="h-24 bg-gray-300 animate-pulse"></div>
                          <div className="p-2">
                            <div className="h-3 bg-gray-300 rounded mb-1 animate-pulse"></div>
                            <div className="h-2 bg-gray-300 rounded w-3/4 animate-pulse"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {newBlock.displayType === 'horizontal' && (
                    <div className="flex gap-2 overflow-x-auto">
                      {[1, 2, 3].slice(0, Math.min(3, newBlock.articlesCount || 6)).map(i => (
                        <div 
                          key={i} 
                          className="flex-shrink-0 w-32 rounded p-2"
                          style={{ 
                            backgroundColor: `${newBlock.theme?.primaryColor}15` || '#00BFA615'
                          }}
                        >
                          <div className="h-16 bg-gray-300 rounded mb-2 animate-pulse"></div>
                          <div className="h-2 bg-gray-300 rounded animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  )}

                  {newBlock.displayType === 'gallery' && (
                    <div className="grid grid-cols-3 gap-1">
                      {[1, 2, 3, 4, 5, 6].slice(0, Math.min(6, newBlock.articlesCount || 6)).map(i => (
                        <div key={i} className="aspect-square rounded overflow-hidden">
                          <div className="w-full h-full bg-gray-300 animate-pulse"></div>
                        </div>
                      ))}
                    </div>
                  )}

                  {newBlock.displayType === 'hero-slider' && (
                    <div className="relative h-48 rounded-lg overflow-hidden">
                      <div className="absolute inset-0 bg-gray-300 animate-pulse"></div>
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent">
                        <div className="h-4 bg-white/50 rounded mb-2 w-3/4 animate-pulse"></div>
                        <div className="h-3 bg-white/30 rounded w-1/2 animate-pulse"></div>
                      </div>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {[1, 2, 3].map(i => (
                          <div 
                            key={i} 
                            className={`h-1 rounded-full animate-pulse ${i === 1 ? 'w-6 bg-white' : 'w-3 bg-white/50'}`}
                          ></div>
                        ))}
                      </div>
                    </div>
                  )}

                  {newBlock.displayType === 'magazine' && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-2">
                        <div className="h-32 bg-gray-300 rounded animate-pulse"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-15 bg-gray-300 rounded animate-pulse"></div>
                        <div className="h-15 bg-gray-300 rounded animate-pulse"></div>
                      </div>
                    </div>
                  )}

                  {newBlock.type === 'html' && (
                    <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded">
                      <p className="text-center text-gray-500 dark:text-gray-400 text-sm">
                        محتوى HTML مخصص
                      </p>
                    </div>
                  )}
                </div>

                {/* معلومات البلوك */}
                <div className={`mt-4 p-3 rounded-lg text-xs ${
                  darkMode ? 'bg-gray-900/50' : 'bg-gray-50'
                }`}>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>الموقع:</span>
                      <span className={darkMode ? 'text-white' : 'text-gray-800'}>
                        {getPositionLabel(newBlock.position || 'topBanner')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>عدد المقالات:</span>
                      <span className={darkMode ? 'text-white' : 'text-gray-800'}>
                        {newBlock.articlesCount || 6}
                      </span>
                    </div>
                    {newBlock.keywords && newBlock.keywords.length > 0 && (
                      <div className="flex justify-between">
                        <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>الكلمات المفتاحية:</span>
                        <span className={darkMode ? 'text-white' : 'text-gray-800'}>
                          {newBlock.keywords.join(', ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* أزرار الحفظ في أسفل الجدول */}
            <div className={`p-6 border-t ${darkMode ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    resetForm();
                  }}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  إلغاء
                </Button>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={resetForm}
                    className="flex items-center gap-2"
                  >
                    <RotateCcw className="h-4 w-4" />
                    إعادة تعيين
                  </Button>
                  
                  <Button 
                    onClick={saveBlock} 
                    className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white"
                    disabled={!newBlock.name?.trim()}
                  >
                    <Save className="h-4 w-4" />
                    {isEditing ? 'حفظ التعديلات' : 'حفظ البلوك'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal تعديل البلوك */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>تعديل البلوك</DialogTitle>
            <DialogDescription>
              قم بتحديث إعدادات البلوك الذكي
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-block-name" className="text-right block mb-2">عنوان البلوك</Label>
              <Input
                id="edit-block-name"
                value={editingBlock?.name || ''}
                onChange={(e) => setEditingBlock(editingBlock ? { ...editingBlock, name: e.target.value } : null)}
                placeholder="مثال: اليوم الوطني 94"
                maxLength={50}
                className={darkMode ? 'bg-gray-800 border-gray-700' : ''}
              />
              <p className={`text-xs mt-1 text-left ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {editingBlock?.name?.length || 0}/50 حرف
              </p>
            </div>

            <div>
              <Label htmlFor="edit-block-position" className="text-right block mb-2">موقع العرض</Label>
              <RadixSelect
                value={editingBlock?.position}
                onValueChange={(value) => setEditingBlock(editingBlock ? { ...editingBlock, position: value as any } : null)}
              >
                <SelectTrigger id="edit-block-position" className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} max-h-[300px] overflow-y-auto`}>
                  {POSITIONS.map((pos) => (
                    <SelectItem key={pos.value} value={pos.value} className={darkMode ? 'hover:bg-gray-700' : ''}>
                      <div className="flex items-center gap-2">
                        <span>{pos.icon}</span>
                        <div className="text-right">
                          <div className="font-medium">{pos.label}</div>
                          <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {pos.description}
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </RadixSelect>
            </div>

            <div>
              <Label htmlFor="edit-block-type" className="text-right block mb-2">نوع البلوك</Label>
              <RadixSelect
                value={editingBlock?.type}
                onValueChange={(value) => setEditingBlock(editingBlock ? { ...editingBlock, type: value as any } : null)}
              >
                <SelectTrigger id="edit-block-type" className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                  {BLOCK_TYPES.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectItem key={type.value} value={type.value} className={darkMode ? 'hover:bg-gray-700' : ''}>
                        <div className="flex items-center gap-2">
                          <Icon className={`w-4 h-4 ${type.color}`} />
                          <div className="text-right">
                            <div className="font-medium">{type.label}</div>
                            <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {type.description}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </RadixSelect>
            </div>

            <div>
              <Label htmlFor="edit-block-display" className="text-right block mb-2">نوع العرض</Label>
              <RadixSelect
                value={editingBlock?.displayType}
                onValueChange={(value) => setEditingBlock(editingBlock ? { ...editingBlock, displayType: value as any } : null)}
              >
                <SelectTrigger id="edit-block-display" className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                  {displayTypes.map((type) => {
                    return (
                      <SelectItem key={type.value} value={type.value} className={darkMode ? 'hover:bg-gray-700' : ''}>
                        <div className="flex items-center gap-2">
                          <span className={type.color}>{type.icon}</span>
                          <span>{type.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </RadixSelect>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-block-count" className="text-right block mb-2">عدد المقالات</Label>
                <Input
                  id="edit-block-count"
                  type="number"
                  min="1"
                  max="20"
                  value={editingBlock?.articlesCount || 6}
                  onChange={(e) => setEditingBlock(editingBlock ? { ...editingBlock, articlesCount: parseInt(e.target.value) || 6 } : null)}
                  className={darkMode ? 'bg-gray-800 border-gray-700' : ''}
                />
              </div>

              <div>
                <Label htmlFor="edit-block-status" className="text-right block mb-2">حالة البلوك</Label>
                <RadixSelect
                  value={editingBlock?.status}
                  onValueChange={(value) => setEditingBlock(editingBlock ? { ...editingBlock, status: value as any } : null)}
                >
                  <SelectTrigger id="edit-block-status" className={darkMode ? 'bg-gray-800 border-gray-700' : ''}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                    <SelectItem value="active" className={darkMode ? 'hover:bg-gray-700' : ''}>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>مفعل</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="inactive" className={darkMode ? 'hover:bg-gray-700' : ''}>
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-gray-600" />
                        <span>معطل</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="scheduled" className={darkMode ? 'hover:bg-gray-700' : ''}>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span>مجدول</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </RadixSelect>
              </div>
            </div>

            {/* معاينة الألوان */}
            <div className={`p-4 rounded-lg border ${darkMode ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <h4 className={`font-medium mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>الألوان المستخدمة</h4>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div 
                    className="w-12 h-12 rounded-lg border-2 mb-1"
                    style={{ backgroundColor: editingBlock?.theme?.primaryColor || '#00BFA6' }}
                  />
                  <span className="text-xs">أساسي</span>
                </div>
                <div className="text-center">
                  <div 
                    className="w-12 h-12 rounded-lg border-2 mb-1"
                    style={{ backgroundColor: editingBlock?.theme?.backgroundColor || '#ffffff' }}
                  />
                  <span className="text-xs">خلفية</span>
                </div>
                <div className="text-center">
                  <div 
                    className="w-12 h-12 rounded-lg border-2 mb-1 flex items-center justify-center"
                    style={{ backgroundColor: editingBlock?.theme?.textColor || '#1a1a1a' }}
                  >
                    <span className="text-xs" style={{ color: editingBlock?.theme?.backgroundColor || '#ffffff' }}>Aa</span>
                  </div>
                  <span className="text-xs">نص</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                onClick={() => editingBlock && editBlockInline(editingBlock)}
                className="flex items-center gap-2"
              >
                <Edit3 className="h-4 w-4" />
                تعديل متقدم
              </Button>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingBlock(null);
                  }}
                >
                  إلغاء
                </Button>
                
                <Button 
                  onClick={saveQuickEdit} 
                  className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white"
                  disabled={!editingBlock?.name?.trim()}
                >
                  <Save className="h-4 w-4" />
                  حفظ التعديلات
                </Button>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Alert Dialog تأكيد تغيير الحالة */}
      <AlertDialog open={showStatusConfirm} onOpenChange={setShowStatusConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {statusChangeBlock?.status === 'active' 
                ? 'إيقاف تشغيل البلوك' 
                : 'تشغيل البلوك'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusChangeBlock?.status === 'active'
                ? `هل أنت متأكد من إيقاف تشغيل البلوك "${statusChangeBlock?.name}"؟ لن يظهر البلوك في الصفحة الرئيسية.`
                : `هل أنت متأكد من تشغيل البلوك "${statusChangeBlock?.name}"؟ سيظهر البلوك في الصفحة الرئيسية.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmStatusChange}
              className={statusChangeBlock?.status === 'active' 
                ? 'bg-red-600 hover:bg-red-700 text-white' 
                : 'bg-green-600 hover:bg-green-700 text-white'}
            >
              {statusChangeBlock?.status === 'active' ? 'إيقاف' : 'تشغيل'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}