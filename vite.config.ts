import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

// 扫描 public/music/ 目录下的音频/歌词文件，提供 /music-index.json
// 开发模式每次请求实时扫描（往目录里丢文件刷新即可），构建时输出到 dist
function musicIndexPlugin(): Plugin {
  let publicDir = 'public';
  const scan = (): string[] => {
    const musicDir = path.join(publicDir, 'music');
    if (!fs.existsSync(musicDir)) return [];
    const files: string[] = [];
    const walk = (dir: string, prefix: string) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) walk(path.join(dir, entry.name), `${prefix}${entry.name}/`);
        else files.push(`${prefix}${entry.name}`);
      }
    };
    walk(musicDir, '');
    return files.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  };
  const respond = (req: { url?: string }, res: {
    setHeader(name: string, value: string): void;
    end(data?: string): void;
  }): boolean => {
    if (req.url?.split('?')[0] !== '/music-index.json') return false;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.end(JSON.stringify({ files: scan() }));
    return true;
  };
  return {
    name: 'sonic-music-index',
    configResolved(config) {
      publicDir = config.publicDir;
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!respond(req, res)) next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (!respond(req, res)) next();
      });
    },
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'music-index.json',
        source: JSON.stringify({ files: scan() }),
      });
    },
  };
}

// 所有网易云/QQ 本地代理中间件已移除：现在统一使用 Meting API 获取在线音乐
export default defineConfig(() => {
  return {
    plugins: [musicIndexPlugin(), react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR 在 AI Studio 等禁用环境下可关闭
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
