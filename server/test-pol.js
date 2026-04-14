import https from 'https';

const postData = JSON.stringify({
  messages: [
    { role: "system", content: "You are a DBMS tutor." },
    { role: "user", content: "What is 1nf?" }
  ]
});

const options = {
  hostname: 'text.pollinations.ai',
  port: 443,
  path: '/',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const reqPost = https.request(options, (resPost) => {
  let dataChunks = '';
  resPost.on('data', (chunk) => dataChunks += chunk);
  resPost.on('end', () => console.log("Response:", dataChunks));
});

reqPost.on('error', (e) => console.error("Error:", e.message));
reqPost.write(postData);
reqPost.end();
