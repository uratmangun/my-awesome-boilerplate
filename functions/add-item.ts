// Deno function to add items to Redis database with vector embeddings
import { connect } from 'https://deno.land/x/redis@v0.32.3/mod.ts'
import { generateTextEmbeddings } from '../utils/text-embeddings.ts'

interface AddItemRequest {
  title: string
  content: string
  category?: string
  ttlSeconds?: number // Time to live in seconds (optional, defaults to 1 day)
}

interface AddItemResponse {
  success: boolean
  message: string
  item?: {
    id: string
    title: string
    content: string
    category: string
    createdAt: string
    updatedAt: string
    expiresAt: string // ISO string of expiration time (required)
  }
  timestamp: string
}

export default {
  async fetch(request: Request): Promise<Response> {
    // Handle CORS for development
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      })
    }

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Method not allowed. Use POST to add items.',
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
      // Parse request body
      const body: AddItemRequest = await request.json()

      // Validate required fields
      if (!body.title || !body.content) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Title and content are required fields.',
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

      // Generate unique item ID
      const itemId = `item:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`

      // Set TTL to provided value or default to 1 day (86400 seconds)
      const ttlSeconds = body.ttlSeconds || 86400 // Default: 24 hours

      // Calculate expiration time (always required now)
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000).toISOString()

      // Generate vector embeddings for title and content
      const titleEmbedding = await generateTextEmbeddings(body.title)
      const contentEmbedding = await generateTextEmbeddings(body.content)
      const combinedText = `${body.title} ${body.content}`
      const combinedEmbedding = await generateTextEmbeddings(combinedText)

      if (
        titleEmbedding.error ||
        contentEmbedding.error ||
        combinedEmbedding.error
      ) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Failed to generate embeddings for text content.',
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

      // Create item object with embeddings
      const item = {
        id: itemId,
        title: body.title,
        content: body.content,
        category: body.category || 'General',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt, // Always included now
        titleEmbeddings: titleEmbedding.embeddings,
        contentEmbeddings: contentEmbedding.embeddings,
        combinedEmbeddings: combinedEmbedding.embeddings,
      }

      // Store item in Redis using hash operations (compatible with basic Redis)
      // Convert embeddings arrays to strings for storage
      const itemData = {
        id: itemId,
        title: body.title,
        content: body.content,
        category: body.category || 'General',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        expiresAt,
        titleEmbeddings: JSON.stringify(titleEmbedding.embeddings),
        contentEmbeddings: JSON.stringify(contentEmbedding.embeddings),
        combinedEmbeddings: JSON.stringify(combinedEmbedding.embeddings),
      }

      // Use HSET to store the item data
      await redis.hset(itemId, itemData)

      // Set expiration (always required now)
      await redis.expire(itemId, ttlSeconds)

      // Close Redis connection
      redis.close()

      const response: AddItemResponse = {
        success: true,
        message: `Item added successfully to Redis database with ${ttlSeconds}s expiration.`,
        item: {
          id: itemId,
          title: item.title,
          content: item.content,
          category: item.category,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          expiresAt: item.expiresAt, // Always included now
        },
        timestamp: new Date().toISOString(),
      }

      return new Response(JSON.stringify(response), {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      })
    } catch (error) {
      console.error('Error adding item to Redis:', error)

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to add item to Redis database.',
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
