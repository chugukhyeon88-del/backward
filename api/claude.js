/**
 * Vercel Serverless Function — Claude API 스트리밍 프록시
 * POST /api/claude
 * Body: { prompt, maxTokens?, system? }
 */

export const config = { runtime: 'edge' };   // Edge Runtime → 스트리밍 최적화

export default async function handler(req) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'API key not configured on server' }), {
      status: 500,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    });
  }

  const { prompt, maxTokens = 3000, system } = body;
  if (!prompt) {
    return new Response(JSON.stringify({ error: 'prompt is required' }), {
      status: 400,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    });
  }

  // Anthropic API에 스트리밍 요청
  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
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
      ...(system ? { system } : {}),
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!anthropicRes.ok) {
    const err = await anthropicRes.json().catch(() => ({}));
    return new Response(JSON.stringify({ error: err.error?.message || anthropicRes.statusText }), {
      status: anthropicRes.status,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    });
  }

  // 스트림을 클라이언트에 그대로 전달 (SSE pass-through)
  return new Response(anthropicRes.body, {
    status: 200,
    headers: {
      ...corsHeaders(),
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
