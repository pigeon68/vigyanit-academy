const http = require('http');

const data = JSON.stringify({
  studentName: 'Jane Doe',
  yearLevel: '11',
  courseName: 'Year 11 Advanced Mathematics',
  parentEmail: 'parent2@test.com'
});

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/api/checkout',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', body);
    const json = JSON.parse(body);
    if (json.url) {
      console.log('SUCCESS - Checkout URL received');
      console.log('URL contains checkout.stripe.com:', json.url.includes('checkout.stripe.com'));
    }
  });
});

req.on('error', err => console.error('Error:', err));
req.write(data);
req.end();
