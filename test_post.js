const http = require('http');

const data = JSON.stringify({
  titre: "Test API",
  description: "Test node js",
  duree_minutes: 10,
  questions: [
    {
      texte_question: "Q1",
      options: ["A", "B", "C", "D"],
      reponse_correcte: "A",
      points: 1
    }
  ]
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/assessments',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = http.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${body}`);
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.write(data);
req.end();
