# My Awesome Boilerplate

A modern, full-stack web application boilerplate featuring React, Deno, Redis vector search, and AI-powered semantic search capabilities. This project combines a sleek React frontend with a powerful Deno backend, offering both traditional web functionality and advanced AI search features.

## 🚀 Features

### Frontend (React + Vite)
- **Modern React 18** with TypeScript
- **Tailwind CSS** for styling with dark mode support
- **Clerk Authentication** for secure user management
- **React Router** for client-side routing
- **Responsive Design** with mobile-first approach
- **Component Library** with custom UI components

### Backend (Deno)
- **Deno Runtime** for modern JavaScript/TypeScript execution
- **Redis Integration** with vector similarity search
- **AI-Powered Search** using Google GenAI embeddings
- **RESTful API** with CORS support
- **GitHub Integration** for repository management
- **Authentication** with Clerk JWT validation

### AI & Search Capabilities
- **Vector Embeddings** using Google's Gemini embedding model
- **Semantic Search** with cosine similarity
- **Repository Management** with GitHub API integration
- **Real-time Search** with relevance scoring
- **Template Repository** support

## 🛠 Technologies Used

### Frontend Stack
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Clerk for authentication
- React Router for navigation
- Lucide React for icons
- Sonner for notifications

### Backend Stack
- Deno runtime
- Redis for data storage and vector search
- Google GenAI for text embeddings
- Clerk for JWT authentication
- GitHub API integration

### Development Tools
- ESLint for code linting
- Prettier for code formatting
- Husky for git hooks
- TypeScript for type safety
- Concurrently for running multiple processes

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) and **pnpm**
- **Deno** (v1.40 or higher)
- **Redis** server (local or cloud)
- **Git** for version control

## 🚀 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/uratmangun/my-awesome-boilerplate.git
   cd my-awesome-boilerplate
   ```

2. **Install frontend dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Configure your environment variables in `.env`:**
   ```env
   # Redis Configuration
   REDIS_URL=redis://localhost:6379
   
   # Google AI API Key (for embeddings)
   GOOGLE_AI_API_KEY=your_google_ai_api_key
   
   # Clerk Authentication
   VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   ```

## 🏃‍♂️ Usage

### Development Mode

1. **Start the Deno backend server:**
   ```bash
   deno task dev
   ```

2. **In a new terminal, start the React frontend:**
   ```bash
   pnpm dev:vite
   ```

3. **Or run both simultaneously:**
   ```bash
   pnpm dev
   ```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

### Production Build

1. **Build the frontend:**
   ```bash
   pnpm build
   ```

2. **Start the production server:**
   ```bash
   deno task start
   ```

## 📁 Project Structure

```
my-awesome-boilerplate/
├── src/                          # React frontend source
│   ├── components/              # React components
│   │   ├── ui/                 # Reusable UI components
│   │   ├── HomePage.tsx        # Main landing page
│   │   └── AISearchPage.tsx    # AI search interface
│   ├── contexts/               # React contexts
│   ├── hooks/                  # Custom React hooks
│   ├── constants/              # API configuration
│   └── lib/                    # Utility functions
├── functions/                   # Deno serverless functions
│   ├── add-item.ts             # Add GitHub repositories
│   ├── search-items.ts         # Vector similarity search
│   ├── get-item.ts             # Retrieve specific items
│   ├── delete-item.ts          # Delete items
│   ├── init-index.ts           # Initialize Redis index
│   └── list-items-by-url.ts    # List items by domain
├── utils/                       # Backend utilities
│   ├── redis-index.ts          # Redis index management
│   ├── text-embeddings.ts      # AI embedding generation
│   └── auth.ts                 # Authentication utilities
├── public/                      # Static assets
├── main.ts                      # Deno main entry point
├── server.ts                    # Development server
├── deno.json                    # Deno configuration
├── package.json                 # Node.js dependencies
└── vite.config.ts              # Vite configuration
```

## 🔧 Configuration

### Redis Setup

#### Local Redis (Development)
```bash
# Install Redis locally or use Docker
docker run -d -p 6379:6379 redis:alpine

# Update .env
REDIS_URL=redis://localhost:6379
```

#### Cloud Redis (Production)
- **Upstash Redis** (recommended for serverless)
- **Redis Cloud**
- **Railway Redis**

### Clerk Authentication

1. Create a Clerk account at [clerk.com](https://clerk.com)
2. Create a new application
3. Copy your publishable key and secret key to `.env`

### Google AI API

1. Get an API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to your `.env` file as `GOOGLE_AI_API_KEY`

## 🔍 API Endpoints

### Repository Management
- `POST /functions/add-item` - Add GitHub repository
- `GET /functions/list-items-by-url` - List repositories by domain
- `DELETE /functions/delete-item` - Delete repository

### AI Search
- `POST /functions/search-items` - Semantic search with AI
- `GET /functions/get-item` - Get specific item by ID
- `POST /functions/init-index` - Initialize Redis search index

### Example API Usage

```javascript
// Add a GitHub repository
const response = await fetch('/functions/add-item', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionToken}`
  },
  body: JSON.stringify({
    github_repository_url: 'https://github.com/owner/repo',
    url: 'example.com'
  })
});

// Search repositories
const searchResponse = await fetch('/functions/search-items', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionToken}`
  },
  body: JSON.stringify({
    query: 'React TypeScript boilerplate',
    limit: 10,
    searchType: 'combined'
  })
});
```

## 🚀 Deployment

### Deno Deploy (Backend)

1. Create a project on [Deno Deploy](https://deno.com/deploy)
2. Connect your GitHub repository
3. Set environment variables in the dashboard
4. Deploy automatically on push to main branch

### Cloudflare Pages (Frontend)

1. Connect your repository to Cloudflare Pages
2. Set build command: `pnpm build`
3. Set output directory: `dist`
4. Configure environment variables

### Environment Variables for Production

```env
# Backend (Deno Deploy)
REDIS_URL=your_production_redis_url
GOOGLE_AI_API_KEY=your_google_ai_api_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Frontend (Cloudflare Pages)
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_DENO_API_URL=https://your-project.deno.dev
```

## 🧪 Development Scripts

```bash
# Frontend development
pnpm dev:vite          # Start Vite dev server
pnpm build             # Build for production
pnpm preview           # Preview production build

# Backend development
deno task dev          # Start Deno dev server with watch mode
deno task start        # Start production server
deno task main         # Run main.ts directly

# Code quality
pnpm lint              # Run ESLint
pnpm lint:fix          # Fix ESLint issues
pnpm format            # Format code with Prettier
pnpm format:check      # Check code formatting

# Combined development
pnpm dev               # Run both frontend and backend
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Use Prettier for code formatting
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Deno](https://deno.land/) for the modern runtime
- [React](https://reactjs.org/) for the frontend framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
- [Clerk](https://clerk.com/) for authentication
- [Redis](https://redis.io/) for data storage and search
- [Google AI](https://ai.google.dev/) for embeddings

## 📞 Support

If you have any questions or need help, please:

1. Check the [Issues](https://github.com/uratmangun/my-awesome-boilerplate/issues) page
2. Create a new issue if your problem isn't already reported
3. Provide detailed information about your environment and the issue

---

**Happy coding!** 🎉