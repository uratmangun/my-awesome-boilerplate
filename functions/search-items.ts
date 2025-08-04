// Deno function to search items using vector similarity (cosine similarity)
import { connect } from 'https://deno.land/x/redis@v0.32.3/mod.ts'
import { generateTextEmbeddings } from '../utils/text-embeddings.ts'

interface SearchItemsRequest {
  query: string
  limit?: number // Maximum number of results (default: 5)
  searchType?: 'description' | 'repository' | 'combined' // Which embeddings to search (default: combined)
}

interface SearchItemsResponse {
  success: boolean
  message: string
  results?: {
    total: number
    items: Array<{
      id: string
      github_description: string
      github_repository_name: string
      homepage_url: string
      category: string
      createdAt: string
      updatedAt: string
      score: number // Similarity score (higher = more similar)
    }>
  }
  timestamp: string
}

export default {
  async fetch(request: Request): Promise<Response> {
    // Enhanced CORS handler
    // Enhanced CORS handler
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
      'Access-Control-Allow-Headers':
        'Accept, Accept-Language, Content-Language, Content-Type, Authorization, authorization, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    }

    // Handle preflight requests (OPTIONS)
    if (request.method === 'OPTIONS') {
      console.log('Handling CORS preflight request')
      console.log(
        'Request headers:',
        Object.fromEntries(request.headers.entries())
      )
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      })
    }

    // Allow both GET and POST requests
    if (request.method !== 'GET' && request.method !== 'POST') {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Method not allowed. Use GET or POST to search items.',
          timestamp: new Date().toISOString(),
        }),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }

    try {
      let searchParams: SearchItemsRequest

      // Parse request parameters
      if (request.method === 'GET') {
        const url = new URL(request.url)
        searchParams = {
          query: url.searchParams.get('query') || '',
          limit: parseInt(url.searchParams.get('limit') || '5'),
          searchType:
            (url.searchParams.get('searchType') as
              | 'description'
              | 'repository'
              | 'combined') || 'combined',
        }
      } else {
        const body = await request.json()
        searchParams = {
          query: body.query || '',
          limit: body.limit || 5,
          searchType: body.searchType || 'combined',
        }
      }

      // Validate required fields
      if (!searchParams.query.trim()) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Query parameter is required.',
            timestamp: new Date().toISOString(),
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        )
      }

      // Get Redis connection URL from environment
      const redisUrl = Deno.env.get('REDIS_URL')
      if (!redisUrl) {
        return new Response(
          JSON.stringify({
            success: false,
            message:
              'Redis connection not configured. Please set REDIS_URL environment variable.',
            timestamp: new Date().toISOString(),
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        )
      }

      // Connect to Redis
      const redis = await connect({
        hostname: new URL(redisUrl).hostname,
        port: parseInt(new URL(redisUrl).port) || 6379,
        password: new URL(redisUrl).password || undefined,
      })

      // Generate query embeddings
      const queryEmbedding = await generateTextEmbeddings(searchParams.query)
      if (queryEmbedding.error) {
        redis.close()
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Failed to generate embeddings for search query.',
            timestamp: new Date().toISOString(),
          }),
          {
            status: 500,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        )
      }

      // Use basic Redis operations for vector similarity search (compatible with basic Redis)
      let embeddingField: string
      switch (searchParams.searchType) {
        case 'description':
          embeddingField = 'descriptionEmbeddings'
          break
        case 'repository':
          embeddingField = 'repositoryEmbeddings'
          break
        case 'combined':
        default:
          embeddingField = 'combinedEmbeddings'
          break
      }

      // Get all item keys (scan for item:* pattern)
      const itemKeys: string[] = []
      let cursor = '0'
      do {
        const scanResult = await redis.scan(cursor, {
          pattern: 'item:*',
          count: 100,
        })
        cursor = scanResult[0]
        itemKeys.push(...scanResult[1])
      } while (cursor !== '0')

      // Calculate similarity scores for each item
      const items: Array<{
        id: string
        github_description: string
        github_repository_name: string
        homepage_url: string
        category: string
        createdAt: string
        updatedAt: string
        score: number
      }> = []

      for (const itemKey of itemKeys) {
        try {
          // Get item data from Redis hash
          const itemDataArray = await redis.hgetall(itemKey)
          if (!itemDataArray || itemDataArray.length === 0) continue

          // Convert Redis array response to object
          const itemData: Record<string, string> = {}
          for (let i = 0; i < itemDataArray.length; i += 2) {
            itemData[itemDataArray[i]] = itemDataArray[i + 1]
          }

          // Only search items with category "my awesome boilerplate"
          if (itemData.category !== 'my awesome boilerplate') {
            continue
          }

          // Parse stored embeddings
          const storedEmbeddingsStr = itemData[embeddingField]
          if (!storedEmbeddingsStr) continue

          let storedEmbeddings: number[]
          try {
            storedEmbeddings = JSON.parse(storedEmbeddingsStr)
          } catch {
            continue // Skip items with invalid embeddings
          }

          // Calculate cosine similarity
          let dotProduct = 0
          let queryMagnitude = 0
          let storedMagnitude = 0

          for (
            let i = 0;
            i < queryEmbedding.embeddings.length && i < storedEmbeddings.length;
            i++
          ) {
            dotProduct += queryEmbedding.embeddings[i] * storedEmbeddings[i]
            queryMagnitude +=
              queryEmbedding.embeddings[i] * queryEmbedding.embeddings[i]
            storedMagnitude += storedEmbeddings[i] * storedEmbeddings[i]
          }

          queryMagnitude = Math.sqrt(queryMagnitude)
          storedMagnitude = Math.sqrt(storedMagnitude)

          const similarity =
            queryMagnitude && storedMagnitude
              ? dotProduct / (queryMagnitude * storedMagnitude)
              : 0

          items.push({
            id: itemKey,
            github_description: itemData.github_description || '',
            github_repository_name: itemData.github_repository_name || '',
            homepage_url: itemData.homepage_url || '',
            category: itemData.category || 'my awesome boilerplate',
            is_template: itemData.is_template === 'true',
            createdAt: itemData.createdAt || '',
            updatedAt: itemData.updatedAt || '',
            score: similarity,
          })
        } catch (itemError) {
          console.warn(`Error processing item ${itemKey}:`, itemError)
          continue
        }
      }

      // Sort by similarity score (descending) and limit results
      const sortedItems = items
        .sort((a, b) => b.score - a.score)
        .slice(0, searchParams.limit)

      // Close Redis connection
      redis.close()

      const response: SearchItemsResponse = {
        success: true,
        message: `Found ${sortedItems.length} items matching your query using ${searchParams.searchType} embeddings.`,
        results: {
          total: sortedItems.length,
          items: sortedItems,
        },
        timestamp: new Date().toISOString(),
      }

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      })
    } catch (error) {
      console.error('Error searching items:', error)

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to search items in Redis database.',
          error: error.message,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            ...corsHeaders,
          },
        }
      )
    }
  },
}
