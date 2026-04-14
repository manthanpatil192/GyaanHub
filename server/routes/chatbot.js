import express from 'express';

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

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: "You are a helpful DBMS (Database Management Systems) tutor for students. Answer questions clearly, providing examples when appropriate. Keep responses concise and focused on database concepts." }]
        }
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      console.error("Gemini API Error:", data);
      return res.status(500).json({ error: data.error?.message || 'Failed to get response from Gemini API' });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't generate a response.";
    
    res.json({ reply });
  } catch (err) {
    console.error("Chatbot Error:", err);
    res.status(500).json({ error: 'Internal server error while processing request' });
  }
});

export default router;
