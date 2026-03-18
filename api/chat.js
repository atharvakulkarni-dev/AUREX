export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { system, messages, max_tokens } = req.body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured. Add ANTHROPIC_API_KEY in Vercel Environment Variables.' });

  const body = {
    model: 'claude-sonnet-4-20250514',
    max_tokens: Math.min(parseInt(max_tokens) || 2000, 4000),
    messages: messages.slice(0, 5).map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: String(m.content || '').substring(0, 8000)
    })),
  };
  if (system) body.system = String(system).substring(0, 2000);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return res.status(response.ok ? 200 : response.status).json(data);
  } catch (error) {
    return res.status(500).json({ error: 'Server error. Please try again.' });
  }
}
```

Click **"Commit changes"** → Vercel auto-deploys.

---

**Step 3 — Add Anthropic API Key to Vercel**

Go to **vercel.com → aurex project → Settings → Environment Variables → Add New:**
- Name: `ANTHROPIC_API_KEY`  
- Value: your key from **console.anthropic.com** (starts with `sk-ant-...`)
- Click Save → Redeploy

---

## Your repo should now look like this:
```
AUREX/
├── index.html      ✅
├── manifest.json   ✅
├── sw.js           ✅
├── vercel.json     ← simplified (no functions block)
└── api/
    └── chat.js     ← NEW — create this now
