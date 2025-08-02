# Building AI-Powered Semantic Search with Redis Vector Similarity and Deno

## What I Built

I created a modern full-stack application that demonstrates the power of AI-driven semantic search using Redis vector similarity. This isn't your typical keyword-based search - it understands the meaning behind queries and finds relevant content even when exact words don't match.

The application combines a sleek React frontend with a Deno-powered backend, creating a seamless experience for adding, searching, and managing content. Users can perform natural language queries like "machine learning algorithms" and get relevant results even if the stored content uses terms like "AI models" or "neural networks."

Key features include:

- **Semantic Search**: Natural language queries powered by Google GenAI embeddings
- **Real-time Interface**: Modern React UI with dark/light theme support
- **Serverless Architecture**: Built for Deno Deploy and Cloudflare Pages
- **Full CRUD Operations**: Complete item management with vector-powered search
- **Multiple Search Types**: Search by title, content, or combined embeddings

## Demo

🔗 **Repository**: [Redis AI Vector Search Boilerplate](https://github.com/your-username/redis-ai-vector-search)

The project showcases a complete implementation with:

- React 19 frontend with TypeScript and Tailwind CSS
- Deno serverless functions for the API layer
- Redis vector database with cosine similarity search
- Google GenAI for text embedding generation

## How I Used Redis 8

Redis serves as the primary database and search engine in this application, going far beyond traditional caching. Here's how I leveraged Redis 8's advanced capabilities:

### Vector Database Implementation

The core innovation lies in using Redis as a vector database. Each piece of content gets converted into 768-dimensional embeddings using Google GenAI, then stored in Redis alongside the original text:

```typescript
// Store embeddings in Redis hash
await redis.hset(itemKey, {
  title: item.title,
  content: item.content,
  titleEmbeddings: JSON.stringify(titleEmbeddings),
  contentEmbeddings: JSON.stringify(contentEmbeddings),
  combinedEmbeddings: JSON.stringify(combinedEmbeddings),
})
```

### Cosine Similarity Search

Instead of relying on Redis Search modules, I implemented cosine similarity calculations directly in the application layer. This approach ensures compatibility across different Redis deployments while maintaining high performance:

```typescript
// Calculate cosine similarity between query and stored embeddings
let dotProduct = 0
let queryMagnitude = 0
let storedMagnitude = 0

for (let i = 0; i < queryEmbedding.length; i++) {
  dotProduct += queryEmbedding[i] * storedEmbeddings[i]
  queryMagnitude += queryEmbedding[i] * queryEmbedding[i]
  storedMagnitude += storedEmbeddings[i] * storedEmbeddings[i]
}

const similarity =
  dotProduct / (Math.sqrt(queryMagnitude) * Math.sqrt(storedMagnitude))
```

### Multi-Modal Search Strategy

The application supports three distinct search modes:

- **Title Search**: Searches only in document titles using title-specific embeddings
- **Content Search**: Searches only in document content using content-specific embeddings
- **Combined Search**: Searches across both title and content using merged embeddings

This flexibility allows users to fine-tune their search strategy based on their needs.

### Scalable Data Architecture

Redis handles the complete data lifecycle:

- **Storage**: Items stored as Redis hashes with structured fields
- **Indexing**: Vector embeddings stored as JSON strings for efficient retrieval
- **Search**: Scan operations combined with in-memory similarity calculations
- **Management**: Full CRUD operations with automatic timestamp tracking

### Performance Optimizations

The implementation includes several Redis-specific optimizations:

- **Batch Operations**: Using Redis pipelines for bulk operations
- **Memory Efficiency**: Storing embeddings as compressed JSON strings
- **Connection Pooling**: Efficient Redis connection management in serverless functions
- **Scan Patterns**: Using Redis SCAN for memory-efficient key iteration

### Beyond Traditional Use Cases

This project demonstrates Redis 8's evolution from a simple cache to a sophisticated data platform:

1. **Primary Database**: Redis serves as the main data store, not just a cache layer
2. **Vector Search Engine**: Handles complex similarity calculations at scale
3. **Real-time Operations**: Supports instant search results with sub-second response times
4. **Serverless Compatibility**: Works seamlessly with modern deployment platforms

The result is a powerful, scalable search system that understands context and meaning, making it perfect for applications like documentation search, content discovery, recommendation engines, and knowledge bases.

---

_Built with Redis 8, Deno, React, and Google GenAI - showcasing the future of intelligent search applications._
