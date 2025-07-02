import React from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube, Heart, Globe } from 'lucide-react';

export default function Footer() {
  const footerSections = [
    {
      title: 'أقسام سبق',
      links: [
        { label: 'الأخبار', url: '/news' },
        { label: 'رياضة', url: '/category/sports' },
        { label: 'اقتصاد', url: '/category/economy' },
        { label: 'تقنية', url: '/category/tech' },
        { label: 'سيارات', url: '/category/cars' },
      ],
    },
    {
      title: 'عن سبق',
      links: [
        { label: 'من نحن', url: '/about' },
        { label: 'سياسة الخصوصية', url: '/privacy' },
        { label: 'شروط الاستخدام', url: '/terms' },
        { label: 'اتصل بنا', url: '/contact' },
        { label: 'وظائف', url: '/jobs' },
      ],
    },
    {
      title: 'خدماتنا',
      links: [
        { label: 'إعلانات تجارية', url: '/ads' },
        { label: 'الاشتراكات', url: '/subscriptions' },
        { label: 'النشرة البريدية', url: '/newsletter' },
        { label: 'الأرشيف', url: '/archive' },
      ],
    },
  ];

  const socialLinks = [
    { icon: <Facebook className="w-5 h-5"/>, url: 'https://facebook.com/sabqorg', name: 'Facebook' },
    { icon: <Twitter className="w-5 h-5"/>, url: 'https://twitter.com/sabqorg', name: 'Twitter' },
    { icon: <Instagram className="w-5 h-5"/>, url: 'https://instagram.com/sabqorg', name: 'Instagram' },
    { icon: <Youtube className="w-5 h-5"/>, url: 'https://youtube.com/sabqorg', name: 'Youtube' },
  ];

  return (
    <footer className="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Logo and description */}
          <div className="md:col-span-2 lg:col-span-1">
             <div className="flex items-center gap-2 mb-4">
                 <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">س</div>
                 <span className="font-bold text-2xl text-gray-800 dark:text-gray-100 dark:text-white">سبق</span>
             </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
             صحيفة إلكترونية سعودية شاملة، نعمل على مدار الساعة لننقل لكم الحقيقة كما هي، ونغطي كافة الأحداث المحلية والعالمية بمصداقية واحترافية.
            </p>
            <div className="mt-6 flex gap-3">
              {socialLinks.map((social) => (
                <a key={social.name} href={social.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 dark:text-gray-400 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/50 dark:hover:text-blue-400 transition-colors">
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
          {/* Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="font-bold text-gray-800 dark:text-white mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.url}>
                    <Link href={link.url} className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 border-t border-gray-200 dark:border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} صحيفة سبق. جميع الحقوق محفوظة.
          </p>
           <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                <Heart className="w-4 h-4 text-red-500" />
                <span>صنع بحب في المملكة العربية السعودية</span>
                <Globe className="w-4 h-4 text-green-500"/>
              </div>
        </div>
      </div>
    </footer>
  );
} 