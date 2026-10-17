import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import fs from 'fs';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

// LINT.IfChange(aistudio_media_plugin)
function aistudioMediaPlugin(): Plugin {
  return {
    name: 'vite-plugin-aistudio-media',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/assets/aistudio/')) {
          const rawPath = req.url.split('?')[0].split('#')[0];
          try {
            const decodedPath = decodeURIComponent(rawPath);
            const relativePath = decodedPath.replace(/^\//, '');
            const aistudioDir = path.resolve(
              __dirname,
              'public',
              'assets',
              'aistudio',
            );
            const filePath = path.resolve(__dirname, 'public', relativePath);
            if (
              filePath.startsWith(aistudioDir + path.sep) &&
              fs.existsSync(filePath) &&
              fs.statSync(filePath).isFile()
            ) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeMap: Record<string, string> = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.svg': 'image/svg+xml',
                '.bmp': 'image/bmp',
                '.ico': 'image/x-icon',
                '.mp4': 'video/mp4',
                '.webm': 'video/webm',
                '.ogv': 'video/ogg',
                '.mp3': 'audio/mpeg',
                '.wav': 'audio/wav',
                '.ogg': 'audio/ogg',
                '.pdf': 'application/pdf',
              };
              res.setHeader(
                'Content-Type',
                mimeMap[ext] || 'application/octet-stream',
              );
              res.setHeader('Cache-Control', 'no-cache');
              fs.createReadStream(filePath).pipe(res);
              return;
            }
          } catch {
            // Fall through if URI decoding or file access fails
          }
        }
        next();
      });
    },
  };
}
// LINT.ThenChange(//depot/google3/java/com/google/alkali/boq/makersuite/applet_dev_service/templates/initializers/react_theme/vite.config.ts:aistudio_media_plugin)

function mercariApiPlugin(): Plugin {
  return {
    name: 'vite-plugin-mercari-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/mercari')) {
          const urlObj = new URL(req.url, 'http://localhost:3000');
          const mercariUrl = urlObj.searchParams.get('url');
          if (!mercariUrl) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'URL do Mercari é obrigatória' }));
            return;
          }

          try {
            // Normalizar URL se necessário
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

            // 1. Try __NEXT_DATA__ script JSON
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

            // 2. Try JSON-LD
            if (!price || !title) {
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
            }

            // 3. Fallbacks via regex if still missing
            if (!price) {
              const priceMatch =
                html.match(/name=["']product:price:amount["']\s+content=["'](\d+)["']/i) ||
                html.match(/content=["'](\d+)["']\s+name=["']product:price:amount["']/i) ||
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

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: true,
                price,
                title: title || 'Item Mercari JP',
                image,
                currency: 'JPY',
              })
            );
            return;
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                success: false,
                error: err?.message || 'Falha ao buscar dados do Mercari',
              })
            );
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), viteSingleFile(), aistudioMediaPlugin(), mercariApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
