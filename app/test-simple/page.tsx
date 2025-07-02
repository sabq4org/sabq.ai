export default function TestSimplePage() {
  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '48px', color: '#333' }}>صفحة اختبار بسيطة</h1>
      <p style={{ fontSize: '24px', color: '#666' }}>إذا كنت ترى هذه الصفحة، فإن Next.js يعمل بشكل صحيح!</p>
      <p style={{ fontSize: '18px', color: '#999' }}>الوقت: {new Date().toLocaleString('ar-SA')}</p>
    </div>
  )
} 