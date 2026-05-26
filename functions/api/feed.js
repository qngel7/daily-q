/**
 * daily.q.co.kr/api/feed
 * Cloudflare Pages Function — RSS 프록시
 *
 * 사용법: GET /api/feed?url=<RSS_URL>&count=8
 * 반환:  { status: 'ok', items: [{title, link, pubDate}] }
 */

export async function onRequest(context) {
  const url   = new URL(context.request.url);
  const rssUrl = url.searchParams.get('url');
  const count  = Math.min(parseInt(url.searchParams.get('count') || '8'), 20);

  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json; charset=utf-8',
  };

  // preflight
  if (context.request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  if (!rssUrl) {
    return json({ status: 'error', message: 'url 파라미터 필요' }, 400, CORS);
  }

  try {
    const res = await fetch(rssUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; Q-Daily/1.0; +https://daily.q.co.kr)',
        'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
      },
      // Cloudflare 엣지 캐시 5분
      cf: { cacheTtl: 300, cacheEverything: true },
    });

    if (!res.ok) throw new Error(`upstream HTTP ${res.status}`);

    const xml   = await res.text();
    const items = parseRSS(xml, count);

    return json({ status: 'ok', items }, 200, {
      ...CORS,
      'Cache-Control': 'public, max-age=300',
    });

  } catch (e) {
    return json({ status: 'error', message: e.message, items: [] }, 502, CORS);
  }
}

/* ── RSS/Atom 파서 ──────────────────────────────────────── */

function parseRSS(xml, count) {
  const items = [];

  // RSS 2.0 — <item> 블록
  const itemRx = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRx.exec(xml)) !== null && items.length < count) {
    const chunk = m[1];
    const title   = grabTag(chunk, 'title');
    const link    = grabTag(chunk, 'link') || grabAttr(chunk, 'link', 'href');
    const pubDate = grabTag(chunk, 'pubDate')
                 || grabTag(chunk, 'dc:date')
                 || grabTag(chunk, 'date');
    if (title) items.push({ title: cleanText(title), link: link?.trim() || '', pubDate: pubDate?.trim() || '' });
  }

  // Atom — <entry> 블록
  if (items.length === 0) {
    const entryRx = /<entry[\s>]([\s\S]*?)<\/entry>/gi;
    while ((m = entryRx.exec(xml)) !== null && items.length < count) {
      const chunk = m[1];
      const title   = grabTag(chunk, 'title');
      const link    = grabAttr(chunk, 'link', 'href') || grabTag(chunk, 'link');
      const pubDate = grabTag(chunk, 'published') || grabTag(chunk, 'updated');
      if (title) items.push({ title: cleanText(title), link: link?.trim() || '', pubDate: pubDate?.trim() || '' });
    }
  }

  return items;
}

/** CDATA 포함 태그 내용 추출 */
function grabTag(xml, name) {
  const rx = new RegExp(
    `<${name}(?:\\s[^>]*)?>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*<\\/${name}>`,
    'i'
  );
  const m = xml.match(rx);
  return m ? m[1].trim() : null;
}

/** 태그 속성 추출 */
function grabAttr(xml, tagName, attrName) {
  const rx = new RegExp(`<${tagName}[^>]+${attrName}=["']([^"']*)["']`, 'i');
  const m  = xml.match(rx);
  return m ? m[1] : null;
}

/** HTML 엔티티 제거 + 공백 정리 */
function cleanText(s) {
  return s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g,  '&')
    .replace(/&lt;/g,   '<')
    .replace(/&gt;/g,   '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([\da-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
    .replace(/\s+/g, ' ')
    .trim();
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), { status, headers });
}
