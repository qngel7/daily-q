const fs = require('fs');

// feed.js에서 파싱 로직을 그대로 복사해옵니다.
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

function grabTag(xml, name) {
  const rx = new RegExp(
    `<${name}(?:\\s[^>]*)?>\\s*(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?\\s*<\\/${name}>`,
    'i'
  );
  const m = xml.match(rx);
  return m ? m[1].trim() : null;
}

function grabAttr(xml, tagName, attrName) {
  const rx = new RegExp(`<${tagName}[^>]+${attrName}=["']([^"']*)["']`, 'i');
  const m  = xml.match(rx);
  return m ? m[1] : null;
}

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

// 테스트할 RSS 피드 리스트
const testFeeds = [
  { url: 'https://feeds.feedburner.com/zdkorea', name: 'ZDNet KR' },
  { url: 'https://rss.etnews.com/Section901.xml', name: '전자신문' },
  { url: 'https://www.hankyung.com/feed/it', name: '한경 IT' },
  { url: 'https://www.chosun.com/arc/outboundfeeds/rss/category/economy/?outputType=xml', name: '조선비즈' },
  // 해외 탭도 체크해봅니다
  { url: 'https://blog.cloudflare.com/rss/', name: 'CF Blog' },
  { url: 'https://supabase.com/rss.xml', name: 'Supabase' }
];

async function runTest() {
  console.log('====== RSS PARSING TEST STARTED ======\n');
  
  for (const feed of testFeeds) {
    console.log(`📡 Fetching [${feed.name}] from: ${feed.url}...`);
    try {
      const response = await fetch(feed.url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; Q-Daily/1.0; +https://daily.q.co.kr)',
          'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*'
        }
      });
      
      console.log(`   Response Status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        console.log(`   ❌ Failed to fetch. HTTP error!`);
        continue;
      }
      
      const xml = await response.text();
      console.log(`   XML Length: ${xml.length} bytes`);
      
      // 파싱 실행
      const parsedItems = parseRSS(xml, 8);
      console.log(`   Parsed Items: ${parsedItems.length} items found.`);
      
      if (parsedItems.length > 0) {
        console.log(`   ✅ Success! Sample Title: "${parsedItems[0].title}"`);
      } else {
        console.log(`   ❌ Failure. 0 items parsed from XML. (XML Snippet: ${xml.substring(0, 300).replace(/\s+/g, ' ')})`);
      }
    } catch (error) {
      console.log(`   ❌ Error occurred:`, error.message);
    }
    console.log('--------------------------------------------------\n');
  }
}

runTest();
