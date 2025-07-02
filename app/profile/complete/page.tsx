'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, Calendar, Briefcase, GraduationCap, Camera, CheckCircle, Gift,
  ArrowRight, ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

interface ProfileData {
  avatar: string;
  bio: string;
  birthDate: string;
  occupation: string;
  education: string;
  interests: string[];
  readingPreferences: {
    timePreference: string;
    contentLength: string;
    language: string;
  };
  notificationSettings: {
    email: boolean;
    push: boolean;
    categories: string[];
  };
  privacySettings: {
    profileVisibility: string;
    showActivity: boolean;
  };
}

interface InterestOption {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export default function CompleteProfilePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [profileData, setProfileData] = useState<ProfileData>({
    avatar: '',
    bio: '',
    birthDate: '',
    occupation: '',
    education: '',
    interests: [],
    readingPreferences: {
      timePreference: 'morning',
      contentLength: 'medium',
      language: 'arabic'
    },
    notificationSettings: {
      email: true,
      push: true,
      categories: []
    },
    privacySettings: {
      profileVisibility: 'public',
      showActivity: true
    }
  });

  const [availableInterests] = useState<InterestOption[]>([
    { id: 'politics', name: 'السياسة', icon: '🏛️', color: 'bg-red-100 text-red-800' },
    { id: 'economy', name: 'الاقتصاد', icon: '💰', color: 'bg-green-100 text-green-800' },
    { id: 'sports', name: 'الرياضة', icon: '⚽', color: 'bg-blue-100 text-blue-800' },
    { id: 'technology', name: 'التقنية', icon: '💻', color: 'bg-purple-100 text-purple-800' },
    { id: 'health', name: 'الصحة', icon: '🏥', color: 'bg-pink-100 text-pink-800' },
    { id: 'culture', name: 'الثقافة', icon: '🎭', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'entertainment', name: 'الترفيه', icon: '🎬', color: 'bg-indigo-100 text-indigo-800' },
    { id: 'travel', name: 'السفر', icon: '✈️', color: 'bg-cyan-100 text-cyan-800' }
  ]);

  const updateProfileData = (field: string, value: any) => {
    setProfileData(prev => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return {
          ...prev,
          [parent]: {
            ...(prev as any)[parent],
            [child]: value
          }
        };
      }
      return { ...prev, [field]: value };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateProfileData('avatar', e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleInterest = (interestId: string) => {
    const interests = profileData.interests.includes(interestId)
      ? profileData.interests.filter(id => id !== interestId)
      : [...profileData.interests, interestId];
    updateProfileData('interests', interests);
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/profile/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });

      const data = await response.json();

      if (data.success) {
        router.push('/dashboard?welcome=true');
      }
    } catch (error) {
      console.error('فشل في حفظ الملف الشخصي:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 py-12 px-4" dir="rtl">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">سبق</span>
            </div>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">أكمل ملفك الشخصي</h1>
          <p className="mt-2 text-gray-600">هذا سيساعدنا في تخصيص تجربتك الإخبارية</p>
          
          <div className="flex justify-center mt-6 space-x-2 space-x-reverse">
            {[1, 2, 3, 4].map((stepNum) => (
              <div
                key={stepNum}
                className={`w-3 h-3 rounded-full ${
                  stepNum <= step ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">المعلومات الشخصية</h2>
              
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-24 h-24 bg-gray-200 rounded-full overflow-hidden">
                    {profileData.avatar ? (
                      <img src={profileData.avatar} alt="الصورة الشخصية" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <label className="absolute -bottom-2 -left-2 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-700 transition-colors">
                    <Camera className="w-4 h-4 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-500 mt-2">اضغط على الكاميرا لتحديث صورتك</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  نبذة شخصية (اختياري)
                </label>
                <textarea
                  value={profileData.bio}
                  onChange={(e) => updateProfileData('bio', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="اكتب نبذة مختصرة عنك..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  تاريخ الميلاد (اختياري)
                </label>
                <div className="relative">
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="date"
                    value={profileData.birthDate}
                    onChange={(e) => updateProfileData('birthDate', e.target.value)}
                    className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المهنة (اختياري)
                </label>
                <div className="relative">
                  <Briefcase className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={profileData.occupation}
                    onChange={(e) => updateProfileData('occupation', e.target.value)}
                    className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="مطور برمجيات"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  المؤهل التعليمي (اختياري)
                </label>
                <div className="relative">
                  <GraduationCap className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    value={profileData.education}
                    onChange={(e) => updateProfileData('education', e.target.value)}
                    className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">اختر المؤهل التعليمي</option>
                    <option value="high_school">الثانوية العامة</option>
                    <option value="diploma">دبلوم</option>
                    <option value="bachelor">بكالوريوس</option>
                    <option value="master">ماجستير</option>
                    <option value="phd">دكتوراه</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">اهتماماتك</h2>
              <p className="text-gray-600 mb-6">اختر المواضيع التي تهمك لنقدم لك محتوى مخصص</p>
              
              <div className="grid grid-cols-2 gap-4">
                {availableInterests.map(interest => (
                  <button
                    key={interest.id}
                    onClick={() => toggleInterest(interest.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      profileData.interests.includes(interest.id)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center">
                      <span className="text-2xl ml-3">{interest.icon}</span>
                      <div className="text-right">
                        <h3 className="font-medium text-gray-900">{interest.name}</h3>
                        {profileData.interests.includes(interest.id) && (
                          <CheckCircle className="w-5 h-5 text-blue-500 mt-1" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">تفضيلات القراءة</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  متى تفضل قراءة الأخبار؟
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'morning', label: 'صباحاً' },
                    { value: 'afternoon', label: 'ظهراً' },
                    { value: 'evening', label: 'مساءً' }
                  ].map(option => (
                    <label key={option.value} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="timePreference"
                        value={option.value}
                        checked={profileData.readingPreferences.timePreference === option.value}
                        onChange={(e) => updateProfileData('readingPreferences.timePreference', e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="mr-2 text-gray-900">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  أي نوع من المحتوى تفضل؟
                </label>
                <div className="space-y-3">
                  {[
                    { value: 'short', label: 'مقالات قصيرة (أقل من 3 دقائق)' },
                    { value: 'medium', label: 'مقالات متوسطة (3-7 دقائق)' },
                    { value: 'long', label: 'مقالات مفصلة (أكثر من 7 دقائق)' }
                  ].map(option => (
                    <label key={option.value} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="contentLength"
                        value={option.value}
                        checked={profileData.readingPreferences.contentLength === option.value}
                        onChange={(e) => updateProfileData('readingPreferences.contentLength', e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <span className="mr-2 text-gray-900">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">الإعدادات الأخيرة</h2>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">الإشعارات</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <span className="text-gray-900">إشعارات البريد الإلكتروني</span>
                    <input
                      type="checkbox"
                      checked={profileData.notificationSettings.email}
                      onChange={(e) => updateProfileData('notificationSettings.email', e.target.checked)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <span className="text-gray-900">الإشعارات الفورية</span>
                    <input
                      type="checkbox"
                      checked={profileData.notificationSettings.push}
                      onChange={(e) => updateProfileData('notificationSettings.push', e.target.checked)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-900 mb-3">الخصوصية</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">ظهور الملف الشخصي</label>
                    <select
                      value={profileData.privacySettings.profileVisibility}
                      onChange={(e) => updateProfileData('privacySettings.profileVisibility', e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="public">عام - يمكن للجميع رؤيته</option>
                      <option value="private">خاص - مخفي عن الآخرين</option>
                    </select>
                  </div>
                  
                  <label className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <span className="text-gray-900">إظهار نشاط القراءة</span>
                    <input
                      type="checkbox"
                      checked={profileData.privacySettings.showActivity}
                      onChange={(e) => updateProfileData('privacySettings.showActivity', e.target.checked)}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-center mb-2">
                  <Gift className="w-6 h-6 text-green-600 ml-2" />
                  <span className="font-semibold text-green-800">مكافأة إكمال الملف الشخصي</span>
                </div>
                <p className="text-sm text-green-700 text-center">
                  ستحصل على 25 نقطة ولاء إضافية عند إكمال ملفك الشخصي!
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            {step > 1 && (
              <button
                onClick={prevStep}
                className="flex items-center px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <ArrowRight className="w-4 h-4 ml-2" />
                السابق
              </button>
            )}
            
            {step < 4 ? (
              <button
                onClick={nextStep}
                className="mr-auto flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                التالي
                <ArrowLeft className="w-4 h-4 mr-2" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isLoading}
                className="mr-auto flex items-center justify-center px-8 py-3 bg-gradient-to-r from-blue-600 to-green-600 text-white rounded-lg hover:from-blue-700 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 ml-2" />
                    إنهاء الإعداد
                  </>
                )}
              </button>
            )}
          </div>

          {step < 4 && (
            <div className="text-center mt-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-gray-500 hover:text-gray-700 text-sm"
              >
                تخطي هذه الخطوة
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
