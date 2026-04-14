import express from 'express';

import https from 'https';

const router = express.Router();

router.post('/ask', async (req, res) => {
  try {
    const { message, history } = req.body;
    
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Gemini API key not configured on server' });
    }

    // Format history for Gemini API
    const contents = history ? history.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    })) : [];

    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const postData = JSON.stringify({
      contents,
      systemInstruction: {
        parts: [{ text: "You are a helpful DBMS (Database Management Systems) tutor for students. Answer questions clearly but VERY concisely. Keep responses extremely brief and focused." }]
      },
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 250
      }
    });

    // Use gemini-1.5-flash-8b for maximum speed and https to avoid Node fetch hangs
    const options = {
      hostname: 'generativelanguage.googleapis.com',
      port: 443,
      path: \`/v1beta/models/gemini-1.5-flash-8b:generateContent?key=\${apiKey}\`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000 // 10 seconds timeout
    };

    const reqPost = https.request(options, (resPost) => {
      let dataChunks = '';

      resPost.on('data', (chunk) => {
        dataChunks += chunk;
      });

      resPost.on('end', () => {
        try {
          const data = JSON.parse(dataChunks);
          if (resPost.statusCode !== 200) {
            console.error("Gemini API Error:", data);
            return res.status(500).json({ error: data.error?.message || 'Failed to get response from Gemini API' });
          }

          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";
          res.json({ reply });
        } catch (e) {
          res.status(500).json({ error: 'Invalid JSON response from AI provider' });
        }
      });
    });

    reqPost.on('error', (e) => {
      console.error("Chatbot Request Error:", e);
      res.status(500).json({ error: 'Failed to communicate with AI endpoint' });
    });

    reqPost.on('timeout', () => {
      reqPost.destroy();
      res.status(504).json({ error: 'AI generation request timed out' });
    });

    reqPost.write(postData);
    reqPost.end();

  } catch (err) {
    console.error("Chatbot Error:", err);
    res.status(500).json({ error: 'Internal server error while processing request' });
  }
});

export default router;
