import express from 'express';
import https from 'https';
import { findAnswer } from '../utils/knowledge.js';

const router = express.Router();

// Helper to mask API key for logging
const maskKey = (key) => key ? `${key.slice(0, 4)}...${key.slice(-4)}` : 'OFFLINE';

// Health check / Status endpoint
router.get('/status', (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY || "AIzaSyCjMYlTMnXQsmsVGEDR1z7u_zpyUc5OV-Y";
  res.json({
    status: 'ok',
    mode: 'Hybrid (Local + AI Fallback)',
    apiKeyConfigured: !!apiKey,
    apiKeyPreview: maskKey(apiKey),
    engine: 'Local KB v1.0 + Gemini Flash'
  });
});

router.post('/ask', async (req, res) => {
  const requestId = Date.now().toString(36);
  const { message, history } = req.body;

  if (!message) return res.status(400).json({ error: 'Message is required' });

  // 1. Try Local Knowledge Base Match First
  const localResponse = findAnswer(message);
  if (localResponse) {
    console.log(`[Chatbot:${requestId}] Local Match Found`);
    return res.json({ reply: localResponse, source: 'local' });
  }

  // 2. Fallback to AI if no local match
  console.log(`[Chatbot:${requestId}] No local match, trying AI...`);
  
  const apiKey = process.env.GEMINI_API_KEY || "AIzaSyCjMYlTMnXQsmsVGEDR1z7u_zpyUc5OV-Y";
  
  // If no API key and no local match, provide a graceful default
  if (!apiKey) {
    return res.json({ 
      reply: "I'm currently in 'offline expert mode'. I can help with fundamental topics like Normalization, SQL, Joins, ACID properties, and ER Diagrams. For other topics, please try a different phrasing!",
      source: 'offline_default'
    });
  }

  try {
    const contents = history ? history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text || '' }]
    })) : [];

    contents.push({ role: 'user', parts: [{ text: message }] });

    const postData = JSON.stringify({
      contents,
      systemInstruction: {
        parts: [{ text: "You are a helpful DBMS tutor. Be concise, clear, and professional." }]
      },
      generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
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
      timeout: 10000 
    };

    const reqPost = https.request(options, (resPost) => {
      let dataChunks = '';
      resPost.on('data', (chunk) => { dataChunks += chunk; });
      resPost.on('end', () => {
        try {
          const data = JSON.parse(dataChunks);
          if (resPost.statusCode !== 200) {
            // If AI fails (e.g. leaked key), don't show error to user, use graceful fallback
            return res.json({ 
              reply: "I'm focusing on core DBMS fundamentals right now. Feel free to ask about Normalization, SQL, Indexing, or Transactions!",
              source: 'graceful_fallback'
            });
          }
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm not sure about that. Could you ask a more specific DBMS question?";
          res.json({ reply, source: 'ai' });
        } catch (e) {
          res.json({ reply: "I'm having a technical hiccup. Ask me about SQL Joins or Normalization instead!", source: 'fallback' });
        }
      });
    });

    reqPost.on('error', () => {
      res.json({ reply: "I'm currently in offline mode. I can perfectly explain SQL, Normal Forms, or ACID properties!", source: 'offline' });
    });

    reqPost.on('timeout', () => {
      reqPost.destroy();
      res.json({ reply: "Taking a bit long! Let's talk about something I know well, like Database Indexing or ER Diagrams.", source: 'timeout_fallback' });
    });

    reqPost.write(postData);
    reqPost.end();

  } catch (err) {
    res.json({ reply: "I'm available for any DBMS core concept questions!", source: 'error_fallback' });
  }
});

export default router;

