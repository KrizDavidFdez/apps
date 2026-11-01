import type { Request, Response } from 'express';
import { Readable, Transform } from 'stream';

export const config = { maxDuration: 60 };

const UA_BY_CLIENT: Record<string, string> = {
  ANDROID_VR:
    'com.google.android.apps.youtube.vr.oculus/1.60.19 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip',
  VISIONOS:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 15_7_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
};
const UA_WEB =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function pickUserAgent(audioUrl: string): string {
  try {
    const c = new URL(audioUrl).searchParams.get('c') || '';
    return UA_BY_CLIENT[c] || UA_WEB;
  } catch {
    return UA_WEB;
  }
}

function createRangeSkipper(skipBytes: number, endByte?: number) {
  let skipped = 0;
  let emitted = 0;
  const maxBytes = endByte !== undefined ? endByte - skipBytes + 1 : Infinity;

  return new Transform({
    transform(chunk: Buffer, _encoding, callback) {
      if (emitted >= maxBytes) return callback();

      if (skipped < skipBytes) {
        const needed = skipBytes - skipped;
        if (chunk.length <= needed) {
          skipped += chunk.length;
          return callback();
        } else {
          chunk = chunk.subarray(needed);
          skipped = skipBytes;
        }
      }

      const remainingAllowed = maxBytes - emitted;
      if (chunk.length > remainingAllowed) {
        chunk = chunk.subarray(0, remainingAllowed);
      }
      emitted += chunk.length;
      callback(null, chunk);
    },
  });
}

function parseRangeHeader(range: string | undefined) {
  if (!range) return null;
  const m = /bytes=(\d*)-(\d*)/.exec(range);
  if (!m) return null;
  let start = m[1] ? parseInt(m[1], 10) : 0;
  let end = m[2] ? parseInt(m[2], 10) : undefined;
  if (Number.isNaN(start) || start < 0) start = 0;
  if (end !== undefined && (Number.isNaN(end) || end < start)) end = undefined;
  return { start, end };
}

export default async function handler(req: Request, res: Response) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Range, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const audioUrl = req.query.url as string;
  if (!audioUrl) return res.status(400).send('Missing url parameter');

  try {
    const clientRange = req.headers.range;
    const fetchHeaders: Record<string, string> = {
      'User-Agent': pickUserAgent(audioUrl),
      'Accept': '*/*',
      ...(clientRange ? { Range: clientRange } : {})
    };

    const upstreamRes = await fetch(audioUrl, {
      headers: fetchHeaders,
      redirect: 'follow'
    });

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      return res.status(upstreamRes.status).send(`Upstream audio error: HTTP ${upstreamRes.status}`);
    }

    const contentType = upstreamRes.headers.get('content-type') || 'audio/mp4';
    const contentRange = upstreamRes.headers.get('content-range');
    const contentLength = upstreamRes.headers.get('content-length');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const isDownload = req.query.download === '1' || Boolean(req.query.filename);
    if (isDownload) {
      const rawFilename = (req.query.filename as string) || 'audio.mp3';
      const cleanFilename = rawFilename.replace(/["\r\n\\]/g, '_');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${cleanFilename}"; filename*=UTF-8''${encodeURIComponent(cleanFilename)}`
      );
    }

    if (contentRange) res.setHeader('Content-Range', contentRange);
    if (contentLength) res.setHeader('Content-Length', contentLength);

    res.status(upstreamRes.status);

    const webStream = upstreamRes.body;
    if (!webStream) {
      return res.status(502).send('Empty upstream body');
    }

    const nodeStream = Readable.fromWeb(webStream as any);
    const parsedRange = parseRangeHeader(clientRange);

    if (upstreamRes.status === 206 && contentRange) {
      return nodeStream.pipe(res);
    }

    if (parsedRange && parsedRange.start > 0) {
      let totalSize: number | undefined;
      if (contentLength) totalSize = parseInt(contentLength, 10);
      const start = parsedRange.start;
      const end = parsedRange.end;
      res.status(206);
      if (totalSize) {
        const actualEnd = end !== undefined ? Math.min(end, totalSize - 1) : totalSize - 1;
        res.setHeader('Content-Range', `bytes ${start}-${actualEnd}/${totalSize}`);
        res.setHeader('Content-Length', String(actualEnd - start + 1));
      }
      const skipper = createRangeSkipper(start, end);
      return nodeStream.pipe(skipper).pipe(res);
    }

    return nodeStream.pipe(res);
  } catch (err: any) {
    console.error('Proxy audio error:', err);
    return res.status(500).send(`Proxy error: ${err?.message || 'unknown'}`);
  }
}
