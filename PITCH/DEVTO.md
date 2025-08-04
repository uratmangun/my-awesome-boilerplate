# Building an AI-Powered Repository Search with Redis 8 Vector Similarity

## What I Built

I created a modern full-stack web application that combines React, Deno, and Redis 8 to deliver AI-powered semantic search capabilities for GitHub repositories. This isn't just another search tool - it's a smart repository discovery platform that understands the meaning behind your queries using vector embeddings and cosine similarity.

The application features a sleek React frontend with dark mode support, powered by a robust Deno backend that leverages Redis 8's advanced vector search capabilities. Users can add GitHub repositories to their collection and then search through them using natural language queries that go far beyond simple keyword matching.

## Demo

🔗 **Repository**: [My Awesome Boilerplate](https://github.com/uratmangun/my-awesome-boilerplate)

The project showcases a complete implementation of vector similarity search using Redis 8, with features including:
- AI-powered semantic search using Google GenAI embeddings
- Real-time repository management with GitHub API integration
- Multiple search types (description, repository name, or combined embeddings)
- Responsive design with Tailwind CSS and custom UI components
- Secure authentication with Clerk

## How I Used Redis 8

Redis 8 serves as the backbone of this application, going far beyond traditional caching to function as a primary vector database and search engine. Here's how I leveraged its advanced capabilities:

### Vector Storage and Indexing
I used Redis 8's native vector field support to store three types of embeddings for each repository:
- **Description embeddings**: 768-dimensional vectors from repository descriptions
- **Repository name embeddings**: Semantic vectors from repository names  
- **Combined embeddings**: Unified vectors combining both description and name data

The Redis index schema supports both FLAT and HNSW algorithms:
```typescript
// FLAT algorithm for precise similarity on smaller datasets
"$.descriptionEmbeddings" as descriptionEmbeddings VECTOR "FLAT" 6
    "TYPE" FLOAT32
    "DIM" 768
    "DISTANCE_METRIC" "COSINE"

// HNSW for faster approximate search on larger datasets
"$.combinedEmbeddings" as combinedEmbeddings VECTOR "HNSW" 8
    "TYPE" FLOAT32
    "DIM" 768
    "DISTANCE_METRIC" "COSINE"
```

### Semantic Search Implementation
Instead of relying on Redis Search modules that might not be available in all environments, I implemented a custom vector similarity search using Redis 8's core operations:

1. **Vector Generation**: Using Google's Gemini embedding model to convert text queries into 768-dimensional vectors
2. **Similarity Calculation**: Computing cosine similarity between query vectors and stored repository embeddings
3. **Ranking**: Sorting results by similarity scores to surface the most relevant repositories

### Multi-Modal Search Capabilities
The application supports three distinct search modes:
- **Description Search**: Matches against repository description embeddings
- **Repository Search**: Focuses on repository name semantics
- **Combined Search**: Uses unified embeddings for comprehensive matching

### Real-Time Data Management
Redis 8 handles all CRUD operations for repository data, storing complete JSON documents with embedded vectors. The hash-based storage pattern (`item:*`) enables efficient scanning and retrieval while maintaining data integrity.

### Performance Optimization
By leveraging Redis 8's in-memory architecture, the application delivers sub-second search results even when processing complex vector calculations. The cosine similarity computations happen entirely in-memory, making the search experience incredibly responsive.

This implementation demonstrates Redis 8's evolution from a simple cache to a sophisticated vector database capable of powering modern AI applications. The combination of traditional Redis operations with advanced vector capabilities creates a powerful foundation for semantic search that scales beautifully.