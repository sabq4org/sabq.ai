async function testAPI() {
  try {
    console.log('Testing GET /api/categories...');
    const getResponse = await fetch('http://localhost:3000/api/categories');
    console.log('GET Status:', getResponse.status);
    if (getResponse.ok) {
      const data = await getResponse.json();
      console.log('GET Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('GET Error:', await getResponse.text());
    }
    
    console.log('\nTesting POST /api/categories...');
    const timestamp = Date.now();
    const postResponse = await fetch('http://localhost:3000/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: 'اقتصاد ' + timestamp,
        name_en: 'Economy ' + timestamp,
        slug: 'economy-' + timestamp,
        description: 'أخبار الاقتصاد والأعمال',
        color: '#10B981',
        icon: '💰',
        is_active: true
      })
    });
    
    console.log('POST Status:', postResponse.status);
    if (postResponse.ok) {
      const data = await postResponse.json();
      console.log('POST Response:', JSON.stringify(data, null, 2));
    } else {
      console.log('POST Error:', await postResponse.text());
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI(); 