import express from 'express';
import https from 'https';

const router = express.Router();

router.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    mode: 'Cloud AI (Keyless)',
    apiKeyConfigured: true,
    apiKeyPreview: 'FREE_MODE',
    engine: 'Pollinations AI'
  });
});

router.post('/ask', async (req, res) => {
  const requestId = Date.now().toString(36);
  const { message, history } = req.body;

  if (!message) return res.status(400).json({ error: 'Message is required' });

  try {
    const messages = [];
    messages.push({ role: "system", content: "You are a helpful and expert DBMS tutor for university students. Be highly concise, engaging, and professional." });
    
    if (history) {
      history.forEach(msg => {
        messages.push({ role: msg.role === 'model' ? 'assistant' : 'user', content: msg.text || '' });
      });
    }

    messages.push({ role: 'user', content: message });

    const postData = JSON.stringify({ messages });

    const options = {
      hostname: 'text.pollinations.ai',
      port: 443,
      path: '/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 20000 
    };

    const reqPost = https.request(options, (resPost) => {
      let dataChunks = '';
      resPost.on('data', (chunk) => { dataChunks += chunk; });
      resPost.on('end', () => {
        if (resPost.statusCode !== 200) {
          return res.json({ reply: "I'm having a little trouble connecting. Could you repeat that?", source: 'error_fallback' });
        }
        res.json({ reply: dataChunks, source: 'ai' });
      });
    });

    reqPost.on('error', () => {
      res.json({ reply: "Oops! I encountered a network error. Please try again.", source: 'error' });
    });

    reqPost.on('timeout', () => {
      reqPost.destroy();
      res.json({ reply: "That took a bit too long to process. Can we try a simpler database question?", source: 'timeout_fallback' });
    });

    reqPost.write(postData);
    reqPost.end();

  } catch (err) {
    res.json({ reply: "I'm available for any DBMS core concept questions!", source: 'error_fallback' });
  }
});

export default router;

