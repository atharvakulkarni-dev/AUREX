export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', 'https://aurex-atharvakulkarni-dev.vercel.app');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { system, messages, max_tokens } = req.body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Invalid request format' });
  }

  const safeMessages = messages.slice(0, 5).map(m => ({
    role: m.role === 'user' ? 'user' : 'assistant',
    content: String(m.content || '').substring(0, 8000)
  }));

  const safeSystem = system ? String(system).substring(0, 2000) : undefined;
  const safeMaxTokens = Math.min(Math.max(parseInt(max_tokens) || 2000, 100), 4000);

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const body = {
      model: 'claude-sonnet-4-20250514',
      max_tokens: safeMaxTokens,
      messages: safeMessages,
    };
    if (safeSystem) body.system = safeSystem;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: 'AI service error. Please try again.' });
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error) {
    return res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
}
