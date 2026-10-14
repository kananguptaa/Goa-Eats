
from pathlib import Path
import json

# Create the project beside this Python script
ROOT = Path(__file__).resolve().parent / "goa-eats"

folders = [
    "client/public",
    "client/src/components",
    "client/src/pages",
    "client/src/services",
    "client/src/types",
    "client/src/utils",
    "client/src/hooks",
    "client/src/assets",
    "server/src/routes",
    "server/src/services",
    "server/src/middleware",
    "server/src/utils",
    "server/src/config",
]

files = {
    ".gitignore": """
node_modules/
dist/
build/
.env
.env.*
!.env.example
coverage/
*.log
.DS_Store
Thumbs.db
""",

    "package.json": {
        "name": "goa-eats",
        "version": "1.0.0",
        "private": True,
        "scripts": {
            "dev": "concurrently -k -n CLIENT,SERVER \"npm run dev:client\" \"npm run dev:server\"",
            "dev:client": "npm --prefix client run dev -- --host 0.0.0.0",
            "dev:server": "npm --prefix server run dev",
            "build": "npm --prefix client run build"
        },
        "devDependencies": {
            "concurrently": "^9.1.2"
        }
    },

    "README.md": """# Goa Eats

AI-powered personal food discovery map for Goa.

## Frontend
React, TypeScript and Vite.

## Backend
Node.js and Express.

## Start development
Run `npm install` in the root, then install the
client and server dependencies separately.

See the project setup instructions before running.
""",

    "client/package.json": {
        "name": "goa-eats-client",
        "version": "1.0.0",
        "private": True,
        "type": "module",
        "scripts": {
            "dev": "vite --host 0.0.0.0",
            "build": "tsc -b && vite build"
        },
        "dependencies": {
            "react": "latest",
            "react-dom": "latest",
            "leaflet": "latest",
            "react-leaflet": "latest"
        },
        "devDependencies": {
            "@types/leaflet": "latest",
            "@types/react": "latest",
            "@types/react-dom": "latest",
            "typescript": "latest",
            "vite": "latest",
            "@vitejs/plugin-react": "latest"
        }
    },

    "client/index.html": """<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Goa Eats</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
""",

    "client/vite.config.ts": """import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { host: '0.0.0.0', port: 5173 },
})
""",

    "client/tsconfig.json": {
        "compilerOptions": {
            "target": "ES2022",
            "lib": ["ES2022", "DOM", "DOM.Iterable"],
            "module": "ESNext",
            "moduleResolution": "Bundler",
            "skipLibCheck": True,
            "strict": True,
            "noEmit": True,
            "jsx": "react-jsx"
        },
        "include": ["src"]
    },

    "client/src/main.tsx": """import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
)
""",

    "client/src/App.tsx": """function App() {
  return (
    <main className="app">
      <p className="eyebrow">YOUR PERSONAL FOOD MAP</p>
      <h1>Goa Eats</h1>
      <p>Every food discovery, one map.</p>

      <section className="welcome">
        <h2>Your next favourite place awaits.</h2>
        <p>
          Soon, you will be able to collect restaurant
          recommendations and find them on your map.
        </p>
        <p className="status">Project structure initialized.</p>
      </section>
    </main>
  )
}

export default App
""",

    "client/src/index.css": """:root {
  font-family: Inter, system-ui, sans-serif;
  color: #20251f;
  background: #f7f8f4;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  min-width: 320px;
  min-height: 100vh;
}

.app {
  width: min(100% - 32px, 1000px);
  margin: 0 auto;
  padding: 40px 0;
}

.eyebrow {
  color: #55734b;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 2px;
}

h1 { font-size: clamp(36px, 8vw, 56px); }

.welcome {
  margin-top: 24px;
  padding: 28px;
  border: 1px solid #e1e5dc;
  border-radius: 20px;
  background: white;
  line-height: 1.7;
}

.status { color: #55734b; font-weight: 600; }
""",

    "client/src/types/restaurant.ts": """export interface Restaurant {
  id: string
  name: string
  latitude: number | null
  longitude: number | null
  address?: string
  locality?: string
  category?: string
  sourceUrl?: string
  notes?: string
  createdAt: string
  verified: boolean
}
""",

    "client/src/services/api.ts": """export async function checkApiHealth(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3001/api/health')
    return response.ok
  } catch {
    return false
  }
}
""",

    "server/package.json": {
        "name": "goa-eats-server",
        "version": "1.0.0",
        "private": True,
        "type": "module",
        "scripts": {
            "dev": "node --watch src/index.js",
            "start": "node src/index.js"
        },
        "dependencies": {
            "cors": "latest",
            "dotenv": "latest",
            "express": "latest"
        }
    },

    "server/.env.example": """PORT=3001
GEMINI_API_KEY=
""",

    "server/src/index.js": """import 'dotenv/config'
import express from 'express'
import cors from 'cors'

const app = express()
const PORT = Number(process.env.PORT) || 3001

app.use(cors())
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    app: 'Goa Eats',
    message: 'Backend is running.',
  })
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Goa Eats API listening on port ${PORT}`)
})
"""
}


def main():
    ROOT.mkdir(parents=True, exist_ok=True)

    for folder in folders:
        (ROOT / folder).mkdir(parents=True, exist_ok=True)
        print(f"FOLDER: {folder}")

    for relative_path, content in files.items():
        path = ROOT / relative_path
        path.parent.mkdir(parents=True, exist_ok=True)

        if path.exists():
            print(f"SKIPPED existing file: {relative_path}")
            continue

        if isinstance(content, dict):
            text = json.dumps(content, indent=2) + "\n"
        else:
            text = content.strip() + "\n"

        path.write_text(text, encoding="utf-8")
        print(f"CREATED: {relative_path}")

    print("\nProject architecture created successfully!")
    print(f"Project location: {ROOT}")


if __name__ == "__main__":
    main()
