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

function mercariApiPlugin(): Plugin {
  return {
    name: 'mercari-api',
    configureServer(server) {
      server.middlewares.use('/api/mercari', async (req: any, res: any) => {
        try {
          const urlObj = new URL(req.url, 'http://localhost:3000');
          const mercariUrl = urlObj.searchParams.get('url');

          if (!mercariUrl) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'URL do Mercari é obrigatória' }));
            return;
          }

          const trimmed = mercariUrl.trim();
          const itemIdMatch = trimmed.match(/m\d{8,}/i);
          let targetUrl = trimmed;
          if (itemIdMatch) {
            targetUrl = `https://jp.mercari.com/item/${itemIdMatch[0]}`;
          } else if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            targetUrl = `https://${targetUrl}`;
          }

          let html = '';
          try {
            const fetchRes = await fetch(targetUrl, {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
                'Cache-Control': 'no-cache',
              },
            });
            if (fetchRes.ok) {
              html = await fetchRes.text();
            }
          } catch (e) {}

          const priceMatches = [
            html.match(/name=[\\"]*product:price:amount[\\"]*[^>}]*content=[\\"]*(\d+)[\\"]*/i),
            html.match(/[\\"]*name[\\"]*:[\\"]*product:price:amount[\\"]*,[\\"]*content[\\"]*:[\\"]*(\d+)[\\"]*/i),
            html.match(/"name"\s*:\s*"product:price:amount"\s*,\s*"content"\s*:\s*"(\d+)"/i),
            html.match(/"product:price:amount"[\s\S]{0,50}?"content"\s*:\s*"(\d+)"/i),
            html.match(/[\\"]*product:price:amount[\\"]*[\s\S]{0,100}?[\\"]*content[\\"]*:[\\"]*(\d+)[\\"]*/i),
            html.match(/property=[\\"]*product:price:amount[\\"]*[^>}]*content=[\\"]*(\d+)[\\"]*/i),
            html.match(/"price"\s*:\s*"?(\d+)"?/i),
          ];
          let price: number | null = null;
          for (const m of priceMatches) {
            if (m && m[1]) {
              const p = parseInt(m[1], 10);
              if (!isNaN(p) && p > 0) {
                price = p;
                break;
              }
            }
          }

          // Fallback via Jina Reader
          if (!price) {
            try {
              const jinaRes = await fetch(`https://r.jina.ai/${targetUrl}`, {
                headers: { 'X-Return-Format': 'html', 'User-Agent': 'Mozilla/5.0' },
              });
              if (jinaRes.ok) {
                const jinaHtml = await jinaRes.text();
                for (const m of [
                  jinaHtml.match(/name=[\\"]*product:price:amount[\\"]*[^>}]*content=[\\"]*(\d+)[\\"]*/i),
                  jinaHtml.match(/[\\"]*name[\\"]*:[\\"]*product:price:amount[\\"]*,[\\"]*content[\\"]*:[\\"]*(\d+)[\\"]*/i),
                  jinaHtml.match(/"name"\s*:\s*"product:price:amount"\s*,\s*"content"\s*:\s*"(\d+)"/i),
                  jinaHtml.match(/"product:price:amount"[\s\S]{0,50}?"content"\s*:\s*"(\d+)"/i),
                ]) {
                  if (m && m[1]) {
                    const p = parseInt(m[1], 10);
                    if (!isNaN(p) && p > 0) {
                      price = p;
                      html = jinaHtml;
                      break;
                    }
                  }
                }
              }
            } catch (e) {}
          }

          let title = '';
          for (const m of [
            html.match(/property=[\\"]*og:title[\\"]*[^>}]*content=[\\"]*([^\\"]+)[\\"]*/i),
            html.match(/[\\"]*property[\\"]*:[\\"]*og:title[\\"]*,[\\"]*content[\\"]*:[\\"]*([^\\"]+)[\\"]*/i),
            html.match(/"property"\s*:\s*"og:title"[\s\S]{0,50}?"content"\s*:\s*"([^"]+)"/i),
            html.match(/<title>([^<]+)<\/title>/i),
          ]) {
            if (m && m[1]) {
              title = m[1].trim().replace(/\s*-\s*メルカリ$/, '').replace(/\s*by\s*メルカリ$/, '').trim();
              break;
            }
          }

          let image = '';
          for (const m of [
            html.match(/property=[\\"]*og:image[\\"]*[^>}]*content=[\\"]*([^\\"]+)[\\"]*/i),
            html.match(/[\\"]*property[\\"]*:[\\"]*og:image[\\"]*,[\\"]*content[\\"]*:[\\"]*([^\\"]+)[\\"]*/i),
            html.match(/"property"\s*:\s*"og:image"[\s\S]{0,50}?"content"\s*:\s*"([^"]+)"/i),
            html.match(/https:\/\/static\.mercdn\.net\/item\/detail\/orig\/photos\/m\d+_\d+\.jpg(?:\?\d+)?/i),
          ]) {
            if (m && (m[1] || m[0])) {
              image = (m[1] || m[0]).replace(/\\u0026/g, '&');
              break;
            }
          }

          if (!price) {
            res.statusCode = 404;
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify({ success: false, error: 'Preço não encontrado' }));
            return;
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(
            JSON.stringify({
              success: true,
              price,
              title: title || 'Item Mercari JP',
              image,
              currency: 'JPY',
            })
          );
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.end(JSON.stringify({ success: false, error: err?.message || 'Erro' }));
        }
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
