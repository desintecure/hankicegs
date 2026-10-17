import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

export function parseMercariData(html: string) {
  let price: number | null = null;
  let title = '';
  let image = '';

  // 1. Check for product:price:amount in standard meta tags and Next.js RSC streaming scripts
  const priceMatches = [
    html.match(/name=[\\"]*product:price:amount[\\"]*[^>}]*content=[\\"]*(\d+)[\\"]*/i),
    html.match(/[\\"]*name[\\"]*:[\\"]*product:price:amount[\\"]*,[\\"]*content[\\"]*:[\\"]*(\d+)[\\"]*/i),
    html.match(/[\\"]*product:price:amount[\\"]*[\s\S]{0,100}?[\\"]*content[\\"]*:[\\"]*(\d+)[\\"]*/i),
    html.match(/property=[\\"]*product:price:amount[\\"]*[^>}]*content=[\\"]*(\d+)[\\"]*/i),
    html.match(/"price"\s*:\s*"?(\d+)"?/i),
    html.match(/"itemPrice"\s*:\s*"?(\d+)"?/i)
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

  // 2. Check for og:title
  const titleMatches = [
    html.match(/property=[\\"]*og:title[\\"]*[^>}]*content=[\\"]*([^\\"]+)[\\"]*/i),
    html.match(/[\\"]*property[\\"]*:[\\"]*og:title[\\"]*,[\\"]*content[\\"]*:[\\"]*([^\\"]+)[\\"]*/i),
    html.match(/<title>([^<]+)<\/title>/i),
    html.match(/[\\"]*children[\\"]*:[\\"]*([^\\"]*? - メルカリ)[\\"]*/i)
  ];
  for (const m of titleMatches) {
    if (m && m[1]) {
      title = m[1].trim();
      break;
    }
  }

  // 3. Check for og:image
  const imgMatches = [
    html.match(/property=[\\"]*og:image[\\"]*[^>}]*content=[\\"]*([^\\"]+)[\\"]*/i),
    html.match(/[\\"]*property[\\"]*:[\\"]*og:image[\\"]*,[\\"]*content[\\"]*:[\\"]*([^\\"]+)[\\"]*/i),
    html.match(/https:\/\/static\.mercdn\.net\/item\/detail\/orig\/photos\/m\d+_\d+\.jpg(?:\?\d+)?/i)
  ];
  for (const m of imgMatches) {
    if (m && (m[1] || m[0])) {
      image = (m[1] || m[0]).replace(/\\u0026/g, '&');
      break;
    }
  }

  // Sanitize title
  title = title
    .replace(/\s*-\s*メルカリ$/, '')
    .replace(/\s*by\s*メルカリ$/, '')
    .replace(/\s*by\s*Mercari$/, '')
    .trim();

  return { price, title: title || 'Item Mercari JP', image };
}

async function startServer() {
  const app = express();

  // CORS headers for all requests
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });

  // API Mercari route
  app.get('/api/mercari', async (req, res) => {
    const mercariUrl = req.query.url as string;
    if (!mercariUrl) {
      res.status(400).json({ error: 'URL do Mercari é obrigatória' });
      return;
    }

    try {
      const trimmed = mercariUrl.trim();
      // Extract item ID if present to build clean canonical URL
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
        throw new Error(`Mercari retornou código ${fetchRes.status}`);
      }

      const html = await fetchRes.text();
      const parsed = parseMercariData(html);

      if (!parsed.price) {
        throw new Error('Preço do anúncio não encontrado no Mercari');
      }

      res.status(200).json({
        success: true,
        price: parsed.price,
        title: parsed.title,
        image: parsed.image,
        currency: 'JPY',
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        error: err?.message || 'Falha ao buscar dados do Mercari',
      });
    }
  });

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
