export const config = {
  api: { bodyParser: { sizeLimit: '2mb' } },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Server misconfigured: OPENAI_API_KEY is not set.' });

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: 'No text provided.' });

  const oaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a professional translator. Translate the following transcript to Spanish. Preserve paragraph breaks and formatting. Output only the translated text with no commentary.',
        },
        { role: 'user', content: text },
      ],
    }),
  });

  const data = await oaiRes.json();
  if (!oaiRes.ok) return res.status(oaiRes.status).json({ error: data.error?.message || 'Translation failed.' });

  return res.status(200).json({ text: data.choices[0].message.content });
}
