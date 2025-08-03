# My Awesome Boilerplate

A modern full-stack application demonstrating AI-powered semantic search using Redis vector similarity, built with React, TypeScript, and Deno. This project showcases how to implement intelligent search functionality with text embeddings and vector databases.

## 🚀 Features

- **AI Semantic Search**: Natural language queries powered by Google GenAI embeddings
- **Vector Similarity**: Redis-based vector search with cosine similarity
- **Real-time UI**: Modern React interface with dark/light theme support
- **Serverless Ready**: Deno Deploy and Cloudflare Pages compatible
- **Full CRUD Operations**: Add, search, retrieve, and delete items
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Type Safety**: Full TypeScript implementation across frontend and backend

## 🛠 Tech Stack

### Frontend

- **React 19** - Modern UI library with latest features
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **Radix UI** - Accessible component primitives

### Backend

- **Deno** - Modern JavaScript/TypeScript runtime
- **Redis** - Vector database and caching
- **Google GenAI** - Text embedding generation
- **Serverless Functions** - Modular API architecture

### Development Tools

- **ESLint** - Code linting
- **Concurrently** - Parallel script execution
- **pnpm** - Fast package manager

## 📦 Installation

### Prerequisites

- [Deno](https://deno.land/) (latest version)
- [Node.js](https://nodejs.org/) (18+ for frontend)
- [pnpm](https://pnpm.io/) (recommended) or yarn
- Redis instance (local or cloud)
- Google AI API key

### Setup Steps

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd redis-ai-vector-search
   ```

2. **Install frontend dependencies**

   ```bash
   pnpm install
   ```

3. **Configure environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:

   ```env
   REDIS_URL=redis://localhost:6379
   GOOGLE_AI_API_KEY=your_google_ai_api_key
   ```

4. **Start Redis** (if running locally)

   ```bash
   # Using Docker
   docker run -d -p 6379:6379 redis:alpine

   # Or install Redis locally
   # macOS: brew install redis && brew services start redis
   # Ubuntu: sudo apt install redis-server
   ```

## 🚀 Usage

### Development Mode

Start both frontend and backend in development mode:

```bash
pnpm dev
```

This runs:

- Frontend (Vite): http://localhost:5173
- Backend (Deno): http://localhost:8000

### Individual Services

**Frontend only:**

```bash
pnpm dev:vite
```

**Backend only:**

```bash
pnpm dev:deno
```

### Production Build

```bash
pnpm build
```

## 🏗 Project Structure

```
├── src/                    # React frontend source
│   ├── components/         # React components
│   │   ├── ui/            # Reusable UI components
│   │   ├── AISearchPage.tsx
│   │   └── HomePage.tsx
│   ├── contexts/          # React contexts
│   └── constants/         # API configuration
├── functions/             # Deno serverless functions
│   ├── add-item.ts       # Add new items
│   ├── search-items.ts   # Vector similarity search
│   ├── get-item.ts       # Retrieve specific items
│   ├── delete-item.ts    # Remove items
│   └── init-index.ts     # Initialize Redis index
├── utils/                # Shared utilities
│   ├── redis-index.ts    # Redis index management
│   └── text-embeddings.ts # AI embedding generation
├── main.ts               # Deno Deploy entry point
├── server.ts             # Local development server
└── public/               # Static assets
```

## 🔧 Configuration

### Redis Providers

The application supports various Redis providers:

- **Local Development**: Redis on localhost
- **Upstash**: Serverless Redis (recommended for Deno Deploy)
- **Redis Cloud**: Managed Redis service
- **Railway**: Redis hosting platform

### Environment Variables

| Variable            | Description             | Required |
| ------------------- | ----------------------- | -------- |
| `REDIS_URL`         | Redis connection string | Yes      |
| `GOOGLE_AI_API_KEY` | Google GenAI API key    | Yes      |

### API Endpoints

| Endpoint            | Method   | Description                     |
| ------------------- | -------- | ------------------------------- |
| `/api/init-index`   | POST     | Initialize Redis search index   |
| `/api/add-item`     | POST     | Add new searchable item         |
| `/api/search-items` | GET/POST | Semantic search with embeddings |
| `/api/get-item`     | GET      | Retrieve item by ID             |
| `/api/delete-item`  | DELETE   | Remove item from database       |

## 🎯 How It Works

### Vector Search Process

1. **Text Embedding**: User queries are converted to 768-dimensional vectors using Google GenAI
2. **Vector Storage**: Items are stored in Redis with their text embeddings
3. **Similarity Search**: Cosine similarity calculates relevance between query and stored vectors
4. **Ranked Results**: Items are returned sorted by similarity score

### Search Types

- **Title Search**: Search only in item titles
- **Content Search**: Search only in item content
- **Combined Search**: Search across title and content (default)

## 🚀 Deployment

### Deno Deploy

1. Connect your GitHub repository to Deno Deploy
2. Set environment variables in the dashboard
3. Deploy using `main.ts` as the entry point

### Cloudflare Pages

1. Build the frontend: `pnpm build`
2. Deploy the `dist` folder to Cloudflare Pages
3. Configure environment variables for the backend functions

### Self-Hosted

1. Build the project: `pnpm build`
2. Run the Deno server: `deno task start`
3. Serve the frontend from the `dist` folder

## 🧪 Development Workflow

This project follows spec-driven development using Kiro AI specifications:

- **Requirements**: User stories and acceptance criteria
- **Design**: Technical architecture decisions
- **Tasks**: Discrete implementation steps

See `.kiro/specs/` for detailed development specifications.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Redis](https://redis.io/) for vector search capabilities
- [Google GenAI](https://ai.google.dev/) for text embeddings
- [Deno](https://deno.land/) for the modern runtime
- [React](https://react.dev/) for the UI framework

## 📚 Learn More

- [Redis Vector Similarity Search Guide](guide/redis-vector-similarity-search.md)
- [Deno Deploy Documentation](https://deno.com/deploy/docs)
- [Google GenAI API Reference](https://ai.google.dev/docs)

---

Built with ❤️ using modern web technologies and AI-powered search.
