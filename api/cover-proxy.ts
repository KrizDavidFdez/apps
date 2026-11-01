import type { Request, Response } from 'express';

export const config = { maxDuration: 30 };

export default async function handler(req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const targetUrl = req.query.url as string;
  if (!targetUrl) return res.status(400).send("Missing url");

  try {
    const fetchResp = await fetch(targetUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
      },
    });
    if (!fetchResp.ok) return res.status(fetchResp.status).end();
    const buf = await fetchResp.arrayBuffer();
    res.setHeader("Content-Type", fetchResp.headers.get("content-type") || "image/jpeg");
    res.setHeader("Cache-Control", "public, max-age=86400, immutable");
    res.end(Buffer.from(buf));
  } catch {
    res.status(502).end();
  }
}
