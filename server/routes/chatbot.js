import express from 'express';
import https from 'https';

const router = express.Router();

// Helper to mask API key for logging
const maskKey = (key) => key ? `${key.slice(0, 4)}...${key.slice(-4)}` : 'MISSING';

router.get('/status', (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  res.json({
    status: 'ok',
    mode: 'Cloud AI (Groq)',
    apiKeyConfigured: !!apiKey,
    apiKeyPreview: maskKey(apiKey),
    engine: 'llama-3.1-8b-instant via Groq'
  });
});

router.post('/ask', async (req, res) => {
  const { message, history } = req.body;

  if (!message) return res.status(400).json({ error: 'Message is required' });

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY is not configured on the server. Please add it to your .env file.' });
  }

  try {
    const messages = [];
    messages.push({ role: "system", content: "You are a helpful and expert DBMS tutor for university students. Be highly concise, engaging, and professional. Focus on database concepts." });
    
    if (history) {
      history.forEach(msg => {
        messages.push({ role: msg.role === 'model' ? 'assistant' : 'user', content: msg.text || '' });
      });
    }

    messages.push({ role: 'user', content: message });

    const postData = JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: messages,
      temperature: 0.7,
      max_tokens: 500
    });

    const options = {
      hostname: 'api.groq.com',
      port: 443,
      path: '/openai/v1/chat/completions',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 15000 
    };

    const reqPost = https.request(options, (resPost) => {
      let dataChunks = '';
      resPost.on('data', (chunk) => { dataChunks += chunk; });
      resPost.on('end', () => {
        try {
          const data = JSON.parse(dataChunks);
          if (resPost.statusCode !== 200) {
            console.error("Groq API Error:", data);
            return res.status(500).json({ error: data.error?.message || 'Chatbot encountered an error from Groq.' });
          }
          const reply = data.choices?.[0]?.message?.content || "I'm not sure how to respond.";
          res.json({ reply, source: 'groq' });
        } catch (e) {
          res.status(500).json({ error: "Failed to parse AI response." });
        }
      });
    });

    reqPost.on('error', () => {
      res.status(502).json({ error: "Oops! I encountered a network error. Please try again." });
    });

    reqPost.on('timeout', () => {
      reqPost.destroy();
      res.status(504).json({ error: "That took a bit too long to process. Can we try a simpler database question?" });
    });

    reqPost.write(postData);
    reqPost.end();

  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;

