import { notFound } from 'next/navigation'
import { templateService } from '@/lib/services/templateService'
import { Template } from '@/types/template'

interface PreviewPageProps {
  params: Promise<{ token: string }>
}

async function getTemplateByToken(token: string): Promise<Template | null> {
  try {
    return await templateService.validatePreviewToken(token)
  } catch (error) {
    console.error('Error fetching preview template:', error)
    return null
  }
}

export default async function TemplatePreviewPage({ params }: PreviewPageProps) {
  const { token } = await params
  const template = await getTemplateByToken(token)
  
  if (!template) {
    notFound()
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* شريط المعاينة */}
      <div className="bg-yellow-500 text-black px-4 py-2 text-center">
        <p className="text-sm font-medium">
          🎨 وضع المعاينة - {template.name}
        </p>
      </div>
      
      {/* محتوى القالب */}
      <div className="template-preview">
        {template.type === 'header' && (
          <HeaderPreview template={template} />
        )}
        
        {template.type === 'footer' && (
          <FooterPreview template={template} />
        )}
        
        {template.type === 'sidebar' && (
          <SidebarPreview template={template} />
        )}
        
        {/* يمكن إضافة المزيد من أنواع القوالب */}
      </div>
      
      {/* معلومات القالب */}
      <div className="fixed bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
        <h3 className="font-bold text-sm mb-2">معلومات القالب</h3>
        <div className="space-y-1 text-xs text-gray-600">
          <p><strong>النوع:</strong> {template.type}</p>
          <p><strong>الحالة:</strong> {template.is_active ? 'نشط' : 'غير نشط'}</p>
          {template.starts_at && (
            <p><strong>يبدأ في:</strong> {new Date(template.starts_at).toLocaleDateString('ar-SA')}</p>
          )}
          {template.ends_at && (
            <p><strong>ينتهي في:</strong> {new Date(template.ends_at).toLocaleDateString('ar-SA')}</p>
          )}
        </div>
      </div>
    </div>
  )
}

// مكونات المعاينة
function HeaderPreview({ template }: { template: Template }) {
  const content = template.content
  
  return (
    <header 
      className="bg-white shadow-sm"
      style={{
        backgroundColor: template.primary_color || '#ffffff',
        color: template.secondary_color || '#000000'
      }}
    >
      <div className="container mx-auto px-4">
        {/* الشعار */}
        {template.logo_url && (
          <div className="py-4">
            <img 
              src={template.logo_url} 
              alt={template.logo_alt || 'شعار الموقع'}
              width={template.logo_width || 150}
              height={template.logo_height || 50}
              className="h-12 w-auto"
            />
          </div>
        )}
        
        {/* التنقل */}
        {content.navigation?.items && (
          <nav className="py-4">
            <ul className="flex gap-6">
              {content.navigation.items.map((item: any, index: number) => (
                <li key={index}>
                  <a href={item.url} className="hover:opacity-80">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}
        
        {/* روابط التواصل */}
        {template.social_links && template.social_links.length > 0 && (
          <div className="flex gap-4 py-2">
            {template.social_links.map((link, index) => (
              <a 
                key={index} 
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:opacity-80"
              >
                {link.platform}
              </a>
            ))}
          </div>
        )}
      </div>
      
      {/* الأنماط المخصصة */}
      {template.custom_styles && (
        <style dangerouslySetInnerHTML={{ __html: template.custom_styles }} />
      )}
    </header>
  )
}

function FooterPreview({ template }: { template: Template }) {
  const content = template.content
  
  return (
    <footer 
      className="bg-gray-900 text-white py-8 mt-auto"
      style={{
        backgroundColor: template.primary_color || '#1f2937',
        color: template.secondary_color || '#ffffff'
      }}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* أقسام الفوتر */}
          {content.sections?.map((section: any, index: number) => (
            <div key={index}>
              <h3 className="font-bold mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links?.map((link: any, linkIndex: number) => (
                  <li key={linkIndex}>
                    <a 
                      href={link.url} 
                      className="hover:underline opacity-80 hover:opacity-100"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          
          {/* النشرة البريدية */}
          {content.newsletter?.enabled && (
            <div>
              <h3 className="font-bold mb-4">
                {content.newsletter.title || 'النشرة البريدية'}
              </h3>
              <p className="text-sm opacity-80 mb-4">
                {content.newsletter.description || 'اشترك في نشرتنا البريدية'}
              </p>
              <form className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="بريدك الإلكتروني"
                  className="flex-1 px-3 py-2 rounded text-gray-900"
                />
                <button 
                  type="submit"
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded"
                >
                  اشترك
                </button>
              </form>
            </div>
          )}
        </div>
        
        {/* حقوق النشر */}
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-sm opacity-60">
          {content.copyright || '© جميع الحقوق محفوظة'}
        </div>
      </div>
    </footer>
  )
}

function SidebarPreview({ template }: { template: Template }) {
  return (
    <aside className="w-64 bg-gray-100 p-4 min-h-screen">
      <h3 className="font-bold mb-4">الشريط الجانبي</h3>
      <div className="space-y-4">
        {/* محتوى الشريط الجانبي */}
        <pre className="text-xs bg-white p-2 rounded">
          {JSON.stringify(template.content, null, 2)}
        </pre>
      </div>
    </aside>
  )
} 