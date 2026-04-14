import express from 'express';
import https from 'https';

const router = express.Router();

// Helper to mask API key for logging
const maskKey = (key) => key ? `${key.slice(0, 4)}...${key.slice(-4)}` : 'MISSING';

// Health check / Status endpoint
router.get('/status', (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY || "AIzaSyCjMYlTMnXQsmsVGEDR1z7u_zpyUc5OV-Y";
  res.json({
    status: 'ok',
    apiKeyConfigured: !!apiKey,
    apiKeyPreview: maskKey(apiKey),
    engine: 'gemini-1.5-flash'
  });
});

router.post('/ask', async (req, res) => {
  const requestId = Date.now().toString(36);
  console.log(`[Chatbot:${requestId}] Request received:`, { 
    hasMessage: !!req.body.message, 
    historyLength: req.body.history?.length || 0 
  });

  try {
    const { message, history } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyCjMYlTMnXQsmsVGEDR1z7u_zpyUc5OV-Y";
    if (!apiKey) {
      console.error(`[Chatbot:${requestId}] API Key missing`);
      return res.status(500).json({ error: 'Gemini API key not configured on server' });
    }

    const contents = history ? history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text || '' }]
    })) : [];

    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const postData = JSON.stringify({
      contents,
      systemInstruction: {
        parts: [{ text: "You are a helpful DBMS tutor. Be concise, clear, and professional." }]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 500
      }
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 15000 // 15 seconds
    };

    const reqPost = https.request(options, (resPost) => {
      let dataChunks = '';
      resPost.on('data', (chunk) => { dataChunks += chunk; });
      resPost.on('end', () => {
        try {
          const data = JSON.parse(dataChunks);
          if (resPost.statusCode !== 200) {
            console.error(`[Chatbot:${requestId}] Gemini API Error (${resPost.statusCode}):`, data);
            return res.status(resPost.statusCode).json({ 
              error: data.error?.message || 'Gemini API returned an error',
              details: data.error
            });
          }

          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "No response generated.";
          console.log(`[Chatbot:${requestId}] Success`);
          res.json({ reply });
        } catch (e) {
          console.error(`[Chatbot:${requestId}] JSON Parse Error:`, e.message);
          res.status(500).json({ error: 'Failed to parse AI response' });
        }
      });
    });

    reqPost.on('error', (e) => {
      console.error(`[Chatbot:${requestId}] Network Error:`, e.message);
      if (!res.headersSent) {
        res.status(502).json({ error: 'Failed to connect to AI server: ' + e.message });
      }
    });

    reqPost.on('timeout', () => {
      console.error(`[Chatbot:${requestId}] Timeout triggered`);
      reqPost.destroy();
      if (!res.headersSent) {
        res.status(504).json({ error: 'AI request timed out after 15s' });
      }
    });

    reqPost.write(postData);
    reqPost.end();

  } catch (err) {
    console.error(`[Chatbot:${requestId}] Unexpected Error:`, err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;

