// Vercel serverless function — proxies audio to OpenAI Whisper.
// The API key lives only in the server environment variable OPENAI_API_KEY;
// it is never sent to the browser.

export const config = {
  api: {
    bodyParser: false, // we stream the raw multipart body straight through
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Server misconfigured: OPENAI_API_KEY is not set.' });
  }

  try {
    // Collect the raw request body (multipart/form-data from the browser)
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks);

    // Forward verbatim to OpenAI — same Content-Type header preserves the boundary
    const oaiRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': req.headers['content-type'],
      },
      body: rawBody,
    });

    const data = await oaiRes.json();

    if (!oaiRes.ok) {
      return res.status(oaiRes.status).json({ error: data.error?.message || 'Transcription failed.' });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal server error.' });
  }
}
