export default async function handler(req: Request) {
  const url = new URL(req.url);
  const mercariUrl = url.searchParams.get('url');

  if (!mercariUrl) {
    return new Response(JSON.stringify({ error: 'URL do Mercari é obrigatória' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    let targetUrl = mercariUrl.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = `https://${targetUrl}`;
    }

    const fetchRes = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
      },
    });

    if (!fetchRes.ok) {
      throw new Error(`O Mercari retornou status ${fetchRes.status}`);
    }

    const html = await fetchRes.text();
    let price: number | null = null;
    let title = '';
    let image = '';

    // 1. JSON-LD
    const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi);
    if (jsonLdMatch) {
      for (const scriptTag of jsonLdMatch) {
        try {
          const content = scriptTag.replace(/<\/?script[^>]*>/gi, '');
          const data = JSON.parse(content);
          if (data.offers?.price && !price) price = Number(data.offers.price);
          if (data.price && !price) price = Number(data.price);
          if (data.name && !title) title = data.name;
          if (data.image && !image) image = Array.isArray(data.image) ? data.image[0] : data.image;
        } catch (e) {}
      }
    }

    // 2. __NEXT_DATA__
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/i);
    if (nextDataMatch) {
      try {
        const nextData = JSON.parse(nextDataMatch[1]);
        const findInObj = (obj: any) => {
          if (!obj || typeof obj !== 'object') return;
          if ((obj.price !== undefined || obj.itemPrice !== undefined) && !price) {
            const p = Number(obj.price ?? obj.itemPrice);
            if (!isNaN(p) && p > 0) price = p;
          }
          if ((obj.name !== undefined || obj.title !== undefined) && !title && typeof (obj.name || obj.title) === 'string') {
            title = obj.name || obj.title;
          }
          if ((obj.imageUrl !== undefined || obj.image !== undefined || obj.thumbnailUrl !== undefined) && !image) {
            const img = obj.imageUrl || obj.image || obj.thumbnailUrl;
            if (typeof img === 'string' && img.startsWith('http')) image = img;
          }
          for (const key of Object.keys(obj)) {
            findInObj(obj[key]);
          }
        };
        findInObj(nextData);
      } catch (e) {}
    }

    // 3. Fallbacks via meta tags
    if (!price) {
      const priceMatch =
        html.match(/name=["']product:price:amount["']\s+content=["'](\d+)["']/i) ||
        html.match(/content=["'](\d+)["']\s+name=["']product:price:amount["']/i) ||
        html.match(/property=["']product:price:amount["']\s+content=["'](\d+)["']/i) ||
        html.match(/content=["'](\d+)["']\s+property=["']product:price:amount["']/i) ||
        html.match(/"price"\s*:\s*(\d+)/i) ||
        html.match(/"amount"\s*:\s*(\d+)/i);
      if (priceMatch) {
        price = parseInt(priceMatch[1], 10);
      }
    }

    const titleMatch =
      html.match(/property=["']og:title["']\s+content=["']([^"']+)["']/i) ||
      html.match(/<title>([^<]+)<\/title>/i);
    if (!title) {
      title = titleMatch ? titleMatch[1] : '';
    }
    title = title
      .replace(/\s*-\s*メルカリ$/, '')
      .replace(/\s*by\s*メルカリ$/, '')
      .replace(/\s*by\s*Mercari$/, '');

    const imageMatch = html.match(/property=["']og:image["']\s+content=["']([^"']+)["']/i);
    if (!image) {
      image = imageMatch ? imageMatch[1] : '';
    }

    return new Response(
      JSON.stringify({
        success: true,
        price,
        title: title || 'Item Mercari JP',
        image,
        currency: 'JPY',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
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
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
