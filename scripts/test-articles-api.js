const https = require('https');
const http = require('http');

async function testAPI() {
  console.log('🔍 فحص API المقالات...\n');
  
  try {
    // فحص محلي
    console.log('📍 فحص الخادم المحلي (localhost:3001)...');
    const localResponse = await fetch('http://localhost:3001/api/articles?status=published&limit=5');
    const localData = await localResponse.json();
    
    console.log(`✅ الخادم المحلي: ${localData.articles?.length || 0} مقال`);
    
    if (localData.articles && localData.articles.length > 0) {
      console.log('📰 أول مقال:', localData.articles[0].title);
    }
    
  } catch (error) {
    console.log('❌ خطأ في الخادم المحلي:', error.message);
  }
  
  console.log('\n🎉 انتهى الفحص!');
}

testAPI(); 