const { Readable } = require('stream');

module.exports = async function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  if (req.method !== 'POST')   { res.status(405).json({ error: 'Method not allowed' }); return; }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { res.status(500).json({ error: 'ANTHROPIC_API_KEY not set' }); return; }

  const { prompt, maxTokens = 8000, system } = req.body || {};
  if (!prompt) { res.status(400).json({ error: 'prompt required' }); return; }

  const upstream = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      stream: true,
      messages: [{ role: 'user', content: prompt }],
      ...(system ? { system } : {}),
    }),
  });

  if (!upstream.ok) {
    const err = await upstream.json().catch(() => ({}));
    res.status(upstream.status).json({ error: err?.error?.message || upstream.statusText });
    return;
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  Readable.fromWeb(upstream.body).pipe(res);
};
