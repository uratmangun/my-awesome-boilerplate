# Redis AI Vector Search Boilerplate

## Inspiration

Traditional search systems fail to understand context and meaning, forcing users to guess exact keywords. We wanted to create a modern boilerplate that demonstrates how AI-powered semantic search can revolutionize data discovery, making it as natural as having a conversation.

## What it does

This full-stack application enables developers to implement intelligent semantic search using Redis vector similarity and Google GenAI embeddings. Users can add content naturally, search with conversational queries like "How to implement real-time chat?", and get relevance-ranked results that understand intent rather than just matching keywords.

## How we built it

Built using spec-driven development with Kiro AI, we created a modern React frontend with TypeScript, Deno serverless functions for the backend, and Redis for vector storage. The architecture supports multiple deployment platforms including Deno Deploy and Cloudflare Pages. We implemented cosine similarity calculations for vector search and created a responsive UI with dark/light theme support.

## Challenges we ran into

Integrating Google GenAI embeddings with Redis vector storage required careful handling of 768-dimensional vectors and optimizing cosine similarity calculations for performance. Managing CORS in serverless functions across different deployment platforms proved complex. Ensuring compatibility with various Redis providers while maintaining consistent search performance was another significant challenge.

## Accomplishments that we're proud of

Successfully created a production-ready boilerplate that demonstrates advanced AI concepts in an accessible way. Implemented comprehensive CRUD operations with vector similarity search, created 23 automated development workflows using Kiro hooks, and established a spec-driven development process with 4 detailed specifications. The project serves as both a functional application and an educational resource.

## What we learned

Vector similarity search implementation patterns, AI embedding integration techniques, serverless function architecture with Deno, Redis optimization strategies, and modern full-stack development practices. We also discovered the power of spec-driven development for maintaining code quality and project coherence throughout complex feature development.

## What's next for Redis AI Vector Search Boilerplate

Enhanced search filters and faceted search capabilities, multi-language support for global applications, real-time collaboration features, advanced vector indexing algorithms like HNSW, integration with additional AI models beyond Google GenAI, and expanded deployment options for various cloud platforms including AWS and Azure.

## Built with

React 19, TypeScript, Deno, Redis, Google GenAI, Tailwind CSS, Vite, Radix UI, React Router, Kiro AI for development automation, serverless functions architecture, vector similarity search, cosine similarity algorithms, responsive design patterns, and modern development tooling.

## Project Name

Redis AI Vector Search Boilerplate

## Elevator pitch

Modern full-stack boilerplate demonstrating AI-powered semantic search with Redis vector similarity, React frontend, and Deno serverless backend - enabling natural language queries that understand context and meaning.
