export function parseMercariData(html: string) {
  let price: number | null = null;
  let title = '';
  let image = '';

  const priceMatches = [
    html.match(/name=[\\"]*product:price:amount[\\"]*[^>}]*content=[\\"]*(\d+)[\\"]*/i),
    html.match(/[\\"]*name[\\"]*:[\\"]*product:price:amount[\\"]*,[\\"]*content[\\"]*:[\\"]*(\d+)[\\"]*/i),
    html.match(/[\\"]*product:price:amount[\\"]*[\s\S]{0,100}?[\\"]*content[\\"]*:[\\"]*(\d+)[\\"]*/i),
    html.match(/property=[\\"]*product:price:amount[\\"]*[^>}]*content=[\\"]*(\d+)[\\"]*/i),
    html.match(/"price"\s*:\s*"?(\d+)"?/i),
    html.match(/"itemPrice"\s*:\s*"?(\d+)"?/i),
  ];
  for (const m of priceMatches) {
    if (m && m[1]) {
      const p = parseInt(m[1], 10);
      if (!isNaN(p) && p > 0) {
        price = p;
        break;
      }
    }
  }

  const titleMatches = [
    html.match(/property=[\\"]*og:title[\\"]*[^>}]*content=[\\"]*([^\\"]+)[\\"]*/i),
    html.match(/[\\"]*property[\\"]*:[\\"]*og:title[\\"]*,[\\"]*content[\\"]*:[\\"]*([^\\"]+)[\\"]*/i),
    html.match(/<title>([^<]+)<\/title>/i),
    html.match(/[\\"]*children[\\"]*:[\\"]*([^\\"]*? - メルカリ)[\\"]*/i),
  ];
  for (const m of titleMatches) {
    if (m && m[1]) {
      title = m[1].trim();
      break;
    }
  }

  const imgMatches = [
    html.match(/property=[\\"]*og:image[\\"]*[^>}]*content=[\\"]*([^\\"]+)[\\"]*/i),
    html.match(/[\\"]*property[\\"]*:[\\"]*og:image[\\"]*,[\\"]*content[\\"]*:[\\"]*([^\\"]+)[\\"]*/i),
    html.match(/https:\/\/static\.mercdn\.net\/item\/detail\/orig\/photos\/m\d+_\d+\.jpg(?:\?\d+)?/i),
  ];
  for (const m of imgMatches) {
    if (m && (m[1] || m[0])) {
      image = (m[1] || m[0]).replace(/\\u0026/g, '&');
      break;
    }
  }

  title = title
    .replace(/\s*-\s*メルカリ$/, '')
    .replace(/\s*by\s*メルカリ$/, '')
    .replace(/\s*by\s*Mercari$/, '')
    .trim();

  return { price, title: title || 'Item Mercari JP', image };
}

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const mercariUrl = url.searchParams.get('url');

  if (!mercariUrl) {
    return new Response(JSON.stringify({ error: 'URL do Mercari é obrigatória' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }

  try {
    const trimmed = mercariUrl.trim();
    const itemIdMatch = trimmed.match(/m\d{8,}/i);
    let targetUrl = trimmed;
    if (itemIdMatch) {
      targetUrl = `https://jp.mercari.com/item/${itemIdMatch[0]}`;
    } else if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    const fetchRes = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
        'Cache-Control': 'no-cache',
      },
    });

    if (!fetchRes.ok) {
      throw new Error(`O Mercari retornou status ${fetchRes.status}`);
    }

    const html = await fetchRes.text();
    const parsed = parseMercariData(html);

    if (!parsed.price) {
      throw new Error('Preço do anúncio não encontrado no Mercari');
    }

    return new Response(
      JSON.stringify({
        success: true,
        price: parsed.price,
        title: parsed.title,
        image: parsed.image,
        currency: 'JPY',
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: err?.message || 'Falha ao buscar dados do Mercari',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}
