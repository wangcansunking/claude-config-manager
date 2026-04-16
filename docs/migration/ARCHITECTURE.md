# Dashboard V2 Architecture: Express + Vite Migration

> Migration spec for `packages/dashboard` (Next.js 14) to `packages/dashboard-v2` (Vite + Express).
> A developer should be able to implement from this document.

---

## 1. Directory Structure

```
packages/dashboard-v2/
  package.json
  tsconfig.json
  tsconfig.server.json
  vite.config.ts
  tailwind.config.ts
  postcss.config.js
  index.html                      # Vite SPA entry point
  scripts/
    build.mjs                     # Orchestrates client + server build
  src/
    client/
      main.tsx                    # React entry — mounts <App/> to #root
      App.tsx                     # ThemeProvider + RealtimeSync + Router + Layout
      router.tsx                  # React Router route definitions
      globals.css                 # Tailwind directives + CSS variables (unchanged)
      components/
        layout/
          sidebar.tsx
          header.tsx
          detail-panel.tsx
          realtime-sync.tsx
        shared/
          button.tsx
          select.tsx
          stat-card.tsx
          search-box.tsx
          status-badge.tsx
          confirmation-dialog.tsx
          tag.tsx
          markdown-viewer.tsx
        plugin-list/
          plugin-item.tsx
        mcp-list/
          mcp-item.tsx
        profile-grid/
          profile-card.tsx
        settings/
          model-selector.tsx
          env-vars-editor.tsx
          hooks-editor.tsx
        export-import/
          export-panel.tsx
          import-panel.tsx
        overview/
          usage-chart.tsx
          recent-sessions.tsx
          environment-health.tsx
      pages/
        overview.tsx              # / route
        recommended.tsx           # /recommended
        config-plugins.tsx        # /config/plugins
        config-mcp.tsx            # /config/mcp
        config-skills.tsx         # /config/skills
        config-commands.tsx       # /config/commands
        config-settings.tsx       # /config/settings
        profiles.tsx              # /profiles
        activity.tsx              # /activity
      lib/
        api-client.ts             # fetch wrapper (unchanged)
        use-data.ts               # SWR hooks (unchanged)
        theme-context.tsx          # Theme context (remove 'use client')
        use-realtime.ts           # SSE hook (remove 'use client')
    server/
      index.ts                    # Express app — static files + API + SSE
      routes/
        stats.ts                  # GET /api/stats
        plugins.ts                # GET/POST /api/plugins, DELETE/PATCH /api/plugins/:name
        mcp-servers.ts            # GET/POST /api/mcp-servers, DELETE /api/mcp-servers/:name
        settings.ts               # GET/PATCH /api/settings, GET/PUT /api/settings/env, DELETE /api/settings/env/:key
        profiles.ts               # GET/POST /api/profiles, PATCH/DELETE /api/profiles/:name, POST /api/profiles/:name/activate
        export-import.ts          # POST /api/export, POST /api/import
        sessions.ts               # GET /api/sessions, GET /api/sessions/history
        skills.ts                 # GET /api/skills, GET /api/skills/content, POST /api/skills/update, GET /api/skills/search
        commands.ts               # GET /api/commands
        mcp-registry.ts           # GET /api/mcp-registry, POST /api/mcp-registry/install
        marketplaces.ts           # GET/POST /api/marketplaces, DELETE /api/marketplaces/:name, GET /api/marketplaces/:name/plugins
        metrics.ts                # GET /api/metrics
        recommendations.ts        # GET/POST /api/recommendations
        events.ts                 # GET /api/events (SSE)
  dist/                           # Build output (committed to git)
    client/                       # Vite static build
      index.html
      assets/
        index-[hash].js
        index-[hash].css
    server.mjs                    # Single-file Express server (esbuild bundle)
```

---

## 2. File Mapping: Next.js to Vite/Express

### Pages (Next.js `page.tsx` -> React Router pages)

| Next.js File | V2 File | Route Path | Notes |
|---|---|---|---|
| `src/app/page.tsx` | `src/client/pages/overview.tsx` | `/` | Remove `'use client'` directive |
| `src/app/recommended/page.tsx` | `src/client/pages/recommended.tsx` | `/recommended` | Remove `'use client'` directive |
| `src/app/config/page.tsx` | _(redirect in router)_ | `/config` | `Navigate to="/config/plugins"` |
| `src/app/config/plugins/page.tsx` | `src/client/pages/config-plugins.tsx` | `/config/plugins` | Remove `'use client'` directive |
| `src/app/config/mcp/page.tsx` | `src/client/pages/config-mcp.tsx` | `/config/mcp` | Remove `'use client'` directive |
| `src/app/config/skills/page.tsx` | `src/client/pages/config-skills.tsx` | `/config/skills` | Remove `'use client'` directive |
| `src/app/config/commands/page.tsx` | `src/client/pages/config-commands.tsx` | `/config/commands` | Remove `'use client'` directive |
| `src/app/config/settings/page.tsx` | `src/client/pages/config-settings.tsx` | `/config/settings` | Remove `'use client'` directive |
| `src/app/profiles/page.tsx` | `src/client/pages/profiles.tsx` | `/profiles` | Remove `'use client'` directive |
| `src/app/activity/page.tsx` | `src/client/pages/activity.tsx` | `/activity` | Remove `'use client'` directive |
| `src/app/plugins/page.tsx` | _(redirect in router)_ | `/plugins` | `Navigate to="/config/plugins"` |
| `src/app/mcp-servers/page.tsx` | _(redirect in router)_ | `/mcp-servers` | `Navigate to="/config/mcp"` |
| `src/app/skills/page.tsx` | _(redirect in router)_ | `/skills` | `Navigate to="/config/skills"` |
| `src/app/commands/page.tsx` | _(redirect in router)_ | `/commands` | `Navigate to="/config/commands"` |
| `src/app/settings/page.tsx` | _(redirect in router)_ | `/settings` | `Navigate to="/config/settings"` |
| `src/app/sessions/page.tsx` | _(redirect in router)_ | `/sessions` | `Navigate to="/activity"` |
| `src/app/export-import/page.tsx` | _(redirect in router)_ | `/export-import` | `Navigate to="/profiles"` |
| `src/app/metrics/page.tsx` | _(redirect in router)_ | `/metrics` | `Navigate to="/"` |
| `src/app/layout.tsx` | `src/client/App.tsx` | N/A | Becomes the root `<App/>` component |
| `src/app/globals.css` | `src/client/globals.css` | N/A | Unchanged |

### API Routes (Next.js `route.ts` -> Express handlers)

| Next.js File | V2 File | Express Route |
|---|---|---|
| `api/stats/route.ts` | `server/routes/stats.ts` | `GET /api/stats` |
| `api/plugins/route.ts` | `server/routes/plugins.ts` | `GET /api/plugins`, `POST /api/plugins` |
| `api/plugins/[name]/route.ts` | `server/routes/plugins.ts` | `DELETE /api/plugins/:name`, `PATCH /api/plugins/:name` |
| `api/mcp-servers/route.ts` | `server/routes/mcp-servers.ts` | `GET /api/mcp-servers`, `POST /api/mcp-servers` |
| `api/mcp-servers/[name]/route.ts` | `server/routes/mcp-servers.ts` | `DELETE /api/mcp-servers/:name` |
| `api/settings/route.ts` | `server/routes/settings.ts` | `GET /api/settings`, `PATCH /api/settings` |
| `api/settings/env/route.ts` | `server/routes/settings.ts` | `GET /api/settings/env`, `PUT /api/settings/env` |
| `api/settings/env/[key]/route.ts` | `server/routes/settings.ts` | `DELETE /api/settings/env/:key` |
| `api/profiles/route.ts` | `server/routes/profiles.ts` | `GET /api/profiles`, `POST /api/profiles` |
| `api/profiles/[name]/route.ts` | `server/routes/profiles.ts` | `PATCH /api/profiles/:name`, `DELETE /api/profiles/:name` |
| `api/profiles/[name]/activate/route.ts` | `server/routes/profiles.ts` | `POST /api/profiles/:name/activate` |
| `api/export/route.ts` | `server/routes/export-import.ts` | `POST /api/export` |
| `api/import/route.ts` | `server/routes/export-import.ts` | `POST /api/import` |
| `api/sessions/route.ts` | `server/routes/sessions.ts` | `GET /api/sessions` |
| `api/sessions/history/route.ts` | `server/routes/sessions.ts` | `GET /api/sessions/history` |
| `api/skills/route.ts` | `server/routes/skills.ts` | `GET /api/skills` |
| `api/skills/content/route.ts` | `server/routes/skills.ts` | `GET /api/skills/content` |
| `api/skills/update/route.ts` | `server/routes/skills.ts` | `POST /api/skills/update` |
| `api/skills/search/route.ts` | `server/routes/skills.ts` | `GET /api/skills/search` |
| `api/commands/route.ts` | `server/routes/commands.ts` | `GET /api/commands` |
| `api/mcp-registry/route.ts` | `server/routes/mcp-registry.ts` | `GET /api/mcp-registry` |
| `api/mcp-registry/install/route.ts` | `server/routes/mcp-registry.ts` | `POST /api/mcp-registry/install` |
| `api/marketplaces/route.ts` | `server/routes/marketplaces.ts` | `GET /api/marketplaces`, `POST /api/marketplaces` |
| `api/marketplaces/[name]/route.ts` | `server/routes/marketplaces.ts` | `DELETE /api/marketplaces/:name` |
| `api/marketplaces/[name]/plugins/route.ts` | `server/routes/marketplaces.ts` | `GET /api/marketplaces/:name/plugins` |
| `api/metrics/route.ts` | `server/routes/metrics.ts` | `GET /api/metrics` |
| `api/recommendations/route.ts` | `server/routes/recommendations.ts` | `GET /api/recommendations`, `POST /api/recommendations` |
| `api/events/route.ts` | `server/routes/events.ts` | `GET /api/events` (SSE) |

### Components (copy with minimal changes)

All components in `src/components/` copy to `src/client/components/` with only these changes:

1. Remove `'use client'` directives (not needed in Vite)
2. `markdown-viewer.tsx` -- replace `next/dynamic` with React lazy/Suspense

### Lib Files (copy with minimal changes)

| Next.js File | V2 File | Changes |
|---|---|---|
| `lib/api-client.ts` | `client/lib/api-client.ts` | None -- already uses `fetch` |
| `lib/use-data.ts` | `client/lib/use-data.ts` | None -- already uses SWR |
| `lib/theme-context.tsx` | `client/lib/theme-context.tsx` | Remove `'use client'` |
| `lib/use-realtime.ts` | `client/lib/use-realtime.ts` | Remove `'use client'` |
| `lib/launcher.ts` | Deleted | Replaced by `node dist/server.mjs` |

---

## 3. Dependencies

### package.json

```json
{
  "name": "@ccm/dashboard-v2",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "concurrently \"vite\" \"tsx watch src/server/index.ts\"",
    "dev:client": "vite",
    "dev:server": "tsx watch src/server/index.ts",
    "build": "node scripts/build.mjs",
    "start": "node dist/server.mjs",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "@ccm/core": "*",
    "@ccm/types": "*",
    "chokidar": "^3.6.0",
    "cors": "^2.8.5",
    "express": "^4.21.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-markdown": "^10.1.0",
    "react-router-dom": "^6.28.0",
    "remark-gfm": "^4.0.1",
    "swr": "^2.4.1"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.0",
    "concurrently": "^9.0.0",
    "esbuild": "^0.24.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "tsx": "^4.19.0",
    "typescript": "^5.5.0",
    "vite": "^5.4.0"
  }
}
```

**Production runtime dependencies (bundled into dist/server.mjs):** express, cors, chokidar, @ccm/core, @ccm/types

**Client-side dependencies (bundled into dist/client/assets/):** react, react-dom, react-router-dom, swr, react-markdown, remark-gfm

**Dev-only:** vite, @vitejs/plugin-react, tailwindcss, postcss, autoprefixer, esbuild, tsx, concurrently, all @types/*

---

## 4. Build Pipeline

### 4.1 vite.config.ts

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: '.', // project root (where index.html lives)
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/client'),
    },
  },
  build: {
    outDir: 'dist/client',
    emptyDirFirst: true,
    sourcemap: false,
    // Keep output small
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          swr: ['swr'],
          markdown: ['react-markdown', 'remark-gfm'],
        },
      },
    },
  },
  server: {
    port: 5173,
    // Proxy API calls to Express in dev
    proxy: {
      '/api': {
        target: 'http://localhost:3399',
        changeOrigin: true,
      },
    },
  },
});
```

### 4.2 index.html (Vite entry)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Claude Config Manager</title>
  <meta name="description" content="Manage your Claude configuration, plugins, MCP servers, and more." />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/client/main.tsx"></script>
</body>
</html>
```

### 4.3 scripts/build.mjs (build orchestrator)

```js
import { build as viteBuild } from 'vite';
import { build as esbuild } from 'esbuild';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

async function build() {
  console.log('[1/2] Building client with Vite...');
  await viteBuild({
    root,
    configFile: resolve(root, 'vite.config.ts'),
  });

  console.log('[2/2] Bundling server with esbuild...');
  await esbuild({
    entryPoints: [resolve(root, 'src/server/index.ts')],
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'esm',
    outfile: resolve(root, 'dist/server.mjs'),
    // Externalize Node.js built-ins only
    external: [
      'fsevents',  // optional macOS dep of chokidar
    ],
    // Bundle ALL npm dependencies into the single file
    // so no node_modules needed at runtime
    banner: {
      js: [
        'import { createRequire } from "module";',
        'const require = createRequire(import.meta.url);',
      ].join('\n'),
    },
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    sourcemap: false,
    minify: true,
    // Resolve workspace packages
    alias: {
      '@ccm/core': resolve(root, '..', 'core', 'src', 'index.ts'),
      '@ccm/types': resolve(root, '..', 'types', 'src', 'index.ts'),
    },
  });

  console.log('Build complete!');
  console.log('  Client: dist/client/');
  console.log('  Server: dist/server.mjs');
  console.log('  Start:  node dist/server.mjs');
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

### 4.4 tsconfig.json (client)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "paths": {
      "@/*": ["./src/client/*"]
    }
  },
  "include": ["src/client/**/*", "src/server/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 4.5 tailwind.config.ts (unchanged)

```ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/client/**/*.{js,ts,jsx,tsx}',
    './index.html',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'bg-hover': 'var(--bg-hover)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-faint': 'var(--text-faint)',
        'accent-purple': 'var(--accent)',
        'accent-purple-light': 'var(--accent-light)',
        'accent-purple-hover': 'var(--accent-hover)',
        'accent-green': 'var(--status-green)',
        'accent-emerald': '#10b981',
        'border-primary': 'var(--border-strong)',
        'border-secondary': '#34343a',
      },
    },
  },
  plugins: [],
};

export default config;
```

### 4.6 postcss.config.js

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

---

## 5. API Route Migration Guide

### Pattern: Next.js route.ts -> Express handler

Every Next.js API route follows the same conversion pattern.

**Next.js (before):**
```ts
// src/app/api/plugins/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PluginManager, getClaudeHome } from '@ccm/core';

export async function GET() {
  try {
    const home = getClaudeHome();
    const plugins = await new PluginManager(home).list();
    return NextResponse.json(plugins);
  } catch (err) {
    console.error('[GET /api/plugins]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as { name?: string };
    const { name } = body;
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Missing required field: name' }, { status: 400 });
    }
    return NextResponse.json({ message: 'Not supported' }, { status: 501 });
  } catch (err) {
    console.error('[POST /api/plugins]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Express (after):**
```ts
// src/server/routes/plugins.ts
import { Router, Request, Response } from 'express';
import { PluginManager, getClaudeHome } from '@ccm/core';

const router = Router();

router.get('/api/plugins', async (_req: Request, res: Response) => {
  try {
    const home = getClaudeHome();
    const plugins = await new PluginManager(home).list();
    res.json(plugins);
  } catch (err) {
    console.error('[GET /api/plugins]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/api/plugins', async (req: Request, res: Response) => {
  try {
    const { name } = req.body as { name?: string };
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Missing required field: name' });
    }
    res.status(501).json({ message: 'Not supported' });
  } catch (err) {
    console.error('[POST /api/plugins]', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

### Conversion rules

| Next.js | Express |
|---|---|
| `NextResponse.json(data)` | `res.json(data)` |
| `NextResponse.json(data, { status: N })` | `res.status(N).json(data)` |
| `return new Response(stream, { headers })` | `res.writeHead(200, headers); stream.pipe(res)` |
| `request.json()` | `req.body` (with `express.json()` middleware) |
| `request.nextUrl.searchParams.get('q')` | `req.query.q` |
| `params: { name: string }` (dynamic route) | `req.params.name` (`:name` in route path) |
| `request.signal.addEventListener('abort', ...)` | `req.on('close', ...)` |

### Parameterized routes

Next.js `[name]` directory segments become Express `:name` params:

- `api/plugins/[name]/route.ts` -> `router.delete('/api/plugins/:name', ...)`
- `api/profiles/[name]/activate/route.ts` -> `router.post('/api/profiles/:name/activate', ...)`
- `api/marketplaces/[name]/plugins/route.ts` -> `router.get('/api/marketplaces/:name/plugins', ...)`
- `api/settings/env/[key]/route.ts` -> `router.delete('/api/settings/env/:key', ...)`

### SSE endpoint migration (events)

The SSE route (`api/events/route.ts`) requires special handling because Express does not use `ReadableStream`:

```ts
// src/server/routes/events.ts
import { Router, Request, Response } from 'express';
import { getClaudeHome } from '@ccm/core';
import { watch } from 'chokidar';

const router = Router();

router.get('/api/events', (req: Request, res: Response) => {
  const home = getClaudeHome();

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  const watcher = watch(
    [
      `${home}/settings.json`,
      `${home}/plugins/installed_plugins.json`,
      `${home}/.mcp.json`,
      `${home}/sessions/*.json`,
      `${home}/plugins/profiles/*.json`,
    ],
    {
      ignoreInitial: true,
      awaitWriteFinish: { stabilityThreshold: 300 },
    },
  );

  watcher.on('all', (event: string, filePath: string) => {
    let category = 'unknown';
    const normPath = filePath.replace(/\\/g, '/');
    if (normPath.includes('settings.json') && !normPath.includes('/profiles/')) {
      category = 'settings';
    } else if (normPath.includes('installed_plugins')) {
      category = 'plugins';
    } else if (normPath.includes('.mcp.json')) {
      category = 'mcps';
    } else if (normPath.includes('/sessions/')) {
      category = 'sessions';
    } else if (normPath.includes('/profiles/')) {
      category = 'profiles';
    }

    const data = JSON.stringify({
      type: 'change',
      category,
      event,
      timestamp: Date.now(),
    });
    res.write(`data: ${data}\n\n`);
  });

  const heartbeat = setInterval(() => {
    res.write(`data: {"type":"heartbeat"}\n\n`);
  }, 30000);

  req.on('close', () => {
    watcher.close();
    clearInterval(heartbeat);
  });
});

export default router;
```

---

## 6. Component Migration Guide

### 6.1 Changes required for ALL components

1. **Remove `'use client'` directives** -- Vite does not use React Server Components, so the directive is unnecessary. Simply delete the line.

2. **Replace `@/` import alias** -- The alias still works (configured in `vite.config.ts`), but now resolves to `src/client/` instead of `src/`. No change needed in import statements as long as the alias is configured.

### 6.2 Component-specific changes

**`sidebar.tsx`** -- The only component that uses Next.js APIs:

```tsx
// BEFORE (Next.js)
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// AFTER (React Router)
import { Link, useLocation } from 'react-router-dom';

// BEFORE
const pathname = usePathname();

// AFTER
const { pathname } = useLocation();
```

The `<Link>` component API is the same: `<Link href="/path">` becomes `<Link to="/path">`.

**`markdown-viewer.tsx`** -- Replace `next/dynamic` with React lazy:

```tsx
// BEFORE (Next.js)
import dynamic from 'next/dynamic';
const ReactMarkdown = dynamic(() => import('react-markdown'), {
  ssr: false,
  loading: () => <p>Loading viewer...</p>,
});

// AFTER (React)
import { lazy, Suspense } from 'react';
const ReactMarkdown = lazy(() => import('react-markdown'));

export function MarkdownViewer({ content, className }: { content: string; className?: string }) {
  return (
    <Suspense fallback={<p style={{ color: 'var(--text-muted)' }}>Loading viewer...</p>}>
      <div className={className ?? 'skill-markdown'}>
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>
    </Suspense>
  );
}
```

**All other components** -- No changes beyond removing `'use client'`. They use standard React APIs, inline styles, and Tailwind classes. They do not import any Next.js modules.

### 6.3 Page-specific changes

All page files need:

1. Remove `'use client'` directive
2. Remove any `import { redirect } from 'next/navigation'` (redirect pages are handled by React Router `Navigate`)
3. No other changes -- all pages already use `@/lib/use-data` hooks and `@/lib/api-client` functions which are framework-agnostic

---

## 7. Router Setup

### 7.1 src/client/main.tsx

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';
import './globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
```

### 7.2 src/client/App.tsx

```tsx
import { ThemeProvider } from '@/lib/theme-context';
import { RealtimeSync } from '@/components/layout/realtime-sync';
import { Sidebar } from '@/components/layout/sidebar';
import { AppRouter } from './router';

export function App() {
  return (
    <ThemeProvider>
      <RealtimeSync />
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main
          style={{
            flex: 1,
            marginLeft: '240px',
            padding: '24px',
            backgroundColor: 'var(--bg-primary)',
            minHeight: '100vh',
          }}
        >
          <AppRouter />
        </main>
      </div>
    </ThemeProvider>
  );
}
```

### 7.3 src/client/router.tsx

```tsx
import { Routes, Route, Navigate } from 'react-router-dom';
import OverviewPage from '@/pages/overview';
import RecommendedPage from '@/pages/recommended';
import ConfigPluginsPage from '@/pages/config-plugins';
import ConfigMcpPage from '@/pages/config-mcp';
import ConfigSkillsPage from '@/pages/config-skills';
import ConfigCommandsPage from '@/pages/config-commands';
import ConfigSettingsPage from '@/pages/config-settings';
import ProfilesPage from '@/pages/profiles';
import ActivityPage from '@/pages/activity';

export function AppRouter() {
  return (
    <Routes>
      {/* Primary routes */}
      <Route path="/" element={<OverviewPage />} />
      <Route path="/recommended" element={<RecommendedPage />} />
      <Route path="/config/plugins" element={<ConfigPluginsPage />} />
      <Route path="/config/mcp" element={<ConfigMcpPage />} />
      <Route path="/config/skills" element={<ConfigSkillsPage />} />
      <Route path="/config/commands" element={<ConfigCommandsPage />} />
      <Route path="/config/settings" element={<ConfigSettingsPage />} />
      <Route path="/profiles" element={<ProfilesPage />} />
      <Route path="/activity" element={<ActivityPage />} />

      {/* Redirects for old/shortcut routes */}
      <Route path="/config" element={<Navigate to="/config/plugins" replace />} />
      <Route path="/plugins" element={<Navigate to="/config/plugins" replace />} />
      <Route path="/mcp-servers" element={<Navigate to="/config/mcp" replace />} />
      <Route path="/skills" element={<Navigate to="/config/skills" replace />} />
      <Route path="/commands" element={<Navigate to="/config/commands" replace />} />
      <Route path="/settings" element={<Navigate to="/config/settings" replace />} />
      <Route path="/sessions" element={<Navigate to="/activity" replace />} />
      <Route path="/export-import" element={<Navigate to="/profiles" replace />} />
      <Route path="/metrics" element={<Navigate to="/" replace />} />

      {/* Catch-all: redirect unknown routes to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
```

---

## 8. Express Server Entry Point

### src/server/index.ts

```ts
import express from 'express';
import cors from 'cors';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Import route modules
import statsRoutes from './routes/stats.js';
import pluginsRoutes from './routes/plugins.js';
import mcpServersRoutes from './routes/mcp-servers.js';
import settingsRoutes from './routes/settings.js';
import profilesRoutes from './routes/profiles.js';
import exportImportRoutes from './routes/export-import.js';
import sessionsRoutes from './routes/sessions.js';
import skillsRoutes from './routes/skills.js';
import commandsRoutes from './routes/commands.js';
import mcpRegistryRoutes from './routes/mcp-registry.js';
import marketplacesRoutes from './routes/marketplaces.js';
import metricsRoutes from './routes/metrics.js';
import recommendationsRoutes from './routes/recommendations.js';
import eventsRoutes from './routes/events.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = parseInt(process.env.CCM_PORT ?? '3399', 10);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API routes (MUST be registered before static file serving)
app.use(statsRoutes);
app.use(pluginsRoutes);
app.use(mcpServersRoutes);
app.use(settingsRoutes);
app.use(profilesRoutes);
app.use(exportImportRoutes);
app.use(sessionsRoutes);
app.use(skillsRoutes);
app.use(commandsRoutes);
app.use(mcpRegistryRoutes);
app.use(marketplacesRoutes);
app.use(metricsRoutes);
app.use(recommendationsRoutes);
app.use(eventsRoutes);

// Serve static client files
const clientDir = resolve(__dirname, 'client');
app.use(express.static(clientDir));

// SPA fallback: serve index.html for all non-API, non-file routes
app.get('*', (_req, res) => {
  res.sendFile(resolve(clientDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Dashboard running at http://localhost:${PORT}`);
});
```

**Key details:**
- API routes are registered first so `/api/*` requests never hit the static file handler
- `express.static` serves everything in `dist/client/`
- The catch-all `app.get('*', ...)` returns `index.html` for all other GET requests, enabling client-side routing
- Port defaults to 3399 (same as current dashboard), configurable via `CCM_PORT`

---

## 9. Bundle Strategy: Making dist/ Committable

### Target size budget

| Artifact | Expected Size |
|---|---|
| `dist/client/index.html` | ~1 KB |
| `dist/client/assets/index-[hash].css` | ~15 KB (Tailwind purged) |
| `dist/client/assets/index-[hash].js` | ~200 KB (React + Router + SWR) |
| `dist/client/assets/vendor-[hash].js` | ~150 KB (React core) |
| `dist/client/assets/markdown-[hash].js` | ~80 KB (react-markdown + remark-gfm) |
| `dist/server.mjs` | ~800 KB-1.5 MB (Express + @ccm/core + chokidar) |
| **Total** | **~1.5-2 MB** |

### Keeping it small

1. **Vite tree-shaking** -- Vite/Rollup automatically removes unused code. The `manualChunks` config splits vendor code for optimal caching.
2. **Tailwind purge** -- Tailwind scans `src/client/**/*.{tsx,ts}` and `index.html` for used classes. Unused CSS is eliminated.
3. **No source maps in production** -- `sourcemap: false` in both Vite and esbuild configs.
4. **Minification** -- Both Vite (terser) and esbuild minify output.
5. **Bundle @ccm/core into server.mjs** -- The esbuild config resolves workspace packages and bundles them inline. No `node_modules` needed at runtime.
6. **chokidar bundling** -- chokidar v3 is CommonJS-compatible and bundles cleanly with esbuild. The `fsevents` optional dep is externalized (macOS only, not needed on other platforms).

### Git strategy

```gitignore
# In packages/dashboard-v2/.gitignore
# Only ignore build intermediates, NOT dist/
node_modules/
*.tsbuildinfo
```

The `dist/` directory IS committed. After each release build:

```sh
cd packages/dashboard-v2
npm run build
git add dist/
git commit -m "build: update dashboard-v2 dist"
```

This means anyone can run `node packages/dashboard-v2/dist/server.mjs` without installing dependencies.

---

## 10. Dev Workflow

### Local development

```sh
cd packages/dashboard-v2
npm install          # one-time setup
npm run dev          # starts both Vite dev server + Express API server
```

- **Vite dev server** runs at `http://localhost:5173` with HMR
- **Express API server** runs at `http://localhost:3399`
- Vite proxies `/api/*` to Express (configured in `vite.config.ts`)
- Edit React components -> instant HMR refresh
- Edit server routes -> `tsx watch` auto-restarts Express

### Production

```sh
npm run build        # Vite + esbuild -> dist/
node dist/server.mjs # Serves everything on :3399
```

---

## 11. Migration Checklist

### Phase 1: Scaffold (estimated: 1 hour)
- [ ] Create `packages/dashboard-v2/` directory
- [ ] Write `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.ts`, `postcss.config.js`
- [ ] Write `index.html`
- [ ] Write `scripts/build.mjs`
- [ ] Write `src/client/main.tsx`, `src/client/App.tsx`, `src/client/router.tsx`
- [ ] Copy `globals.css` to `src/client/globals.css`

### Phase 2: Client (estimated: 2 hours)
- [ ] Copy all `src/components/` to `src/client/components/` -- remove `'use client'`
- [ ] Copy all `src/lib/` to `src/client/lib/` -- remove `'use client'`
- [ ] Migrate sidebar: `next/link` -> `react-router-dom Link`, `usePathname` -> `useLocation`
- [ ] Migrate markdown-viewer: `next/dynamic` -> `React.lazy` + `Suspense`
- [ ] Copy all page files to `src/client/pages/` -- remove `'use client'`, remove Next.js redirect imports
- [ ] Verify `npm run dev:client` starts and renders

### Phase 3: Server (estimated: 2 hours)
- [ ] Write `src/server/index.ts` (Express app skeleton)
- [ ] Migrate each API route file (28 route handlers across 14 files):
  - [ ] `stats.ts`
  - [ ] `plugins.ts` (GET, POST, DELETE :name, PATCH :name)
  - [ ] `mcp-servers.ts` (GET, POST, DELETE :name)
  - [ ] `settings.ts` (GET, PATCH, GET env, PUT env, DELETE env/:key)
  - [ ] `profiles.ts` (GET, POST, PATCH :name, DELETE :name, POST :name/activate)
  - [ ] `export-import.ts` (POST export, POST import)
  - [ ] `sessions.ts` (GET, GET history)
  - [ ] `skills.ts` (GET, GET content, POST update, GET search)
  - [ ] `commands.ts` (GET)
  - [ ] `mcp-registry.ts` (GET, POST install)
  - [ ] `marketplaces.ts` (GET, POST, DELETE :name, GET :name/plugins)
  - [ ] `metrics.ts` (GET)
  - [ ] `recommendations.ts` (GET, POST)
  - [ ] `events.ts` (GET SSE)
- [ ] Verify `npm run dev:server` starts and API routes respond

### Phase 4: Integration (estimated: 1 hour)
- [ ] Run `npm run dev` -- verify full client + server works
- [ ] Test all pages load correctly
- [ ] Test real-time SSE updates trigger SWR revalidation
- [ ] Test theme switching persists across navigation
- [ ] Verify all API endpoints respond correctly

### Phase 5: Build and commit (estimated: 30 minutes)
- [ ] Run `npm run build`
- [ ] Verify `node dist/server.mjs` serves the complete app
- [ ] Check `dist/` size is under 3 MB
- [ ] Commit `dist/` to git
- [ ] Update plugin/CLI references to use `node packages/dashboard-v2/dist/server.mjs` instead of `next start`

---

## 12. Key Differences from Next.js (Summary)

| Aspect | Next.js (current) | Vite + Express (v2) |
|---|---|---|
| Rendering | SSR + client hydration | Client-side only (CSR) |
| Routing | File-based (`app/` directory) | Explicit (`react-router-dom`) |
| API routes | Next.js Route Handlers | Express handlers |
| Link component | `next/link` | `react-router-dom Link` |
| Dynamic imports | `next/dynamic` | `React.lazy` + `Suspense` |
| Path params | `[name]` directories + `params` | Express `:name` + `req.params` |
| Query params | `request.nextUrl.searchParams` | `req.query` |
| SSE | `ReadableStream` | `res.write()` |
| Request body | `request.json()` | `req.body` (via `express.json()`) |
| Response | `NextResponse.json()` | `res.json()` / `res.status().json()` |
| Static files | Next.js built-in | `express.static()` |
| CSS | Tailwind (same) | Tailwind (same) |
| Data fetching | SWR (same) | SWR (same) |
| Real-time | SSE via EventSource (same) | SSE via EventSource (same) |
| Theme | CSS variables + context (same) | CSS variables + context (same) |
| Build output | `.next/` (~50 MB, NOT committed) | `dist/` (~2 MB, committed) |
| Runtime deps | `npm install` required | Zero -- everything bundled |
| Start command | `npx next start -p 3399` | `node dist/server.mjs` |
