// Deno function to get a specific item from Redis database
import { connect } from 'https://deno.land/x/redis@v0.32.3/mod.ts'

interface GetItemRequest {
  id: string
}

interface GetItemResponse {
  success: boolean
  message: string
  item?: {
    id: string
    title: string
    content: string
    category: string
    createdAt: string
    updatedAt: string
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

    // Allow both GET and POST requests
    if (request.method !== 'GET' && request.method !== 'POST') {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Method not allowed. Use GET or POST to retrieve an item.',
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
      let itemId: string = ''

      if (request.method === 'GET') {
        // Extract item ID from URL query parameter
        const url = new URL(request.url)
        itemId = url.searchParams.get('id') || ''
      } else if (request.method === 'POST') {
        // Parse request body for POST requests
        const body: GetItemRequest = await request.json()
        itemId = body.id || ''
      }

      // Validate item ID
      if (!itemId) {
        return new Response(
          JSON.stringify({
            success: false,
            message:
              'Item ID is required. Provide it as a query parameter (?id=...) for GET or in request body for POST.',
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

      // Get item from Redis hash
      const itemDataArray = await redis.hgetall(itemId)
      let itemData: Record<string, string> | null = null

      if (itemDataArray && itemDataArray.length > 0) {
        // Convert Redis array response to object
        itemData = {}
        for (let i = 0; i < itemDataArray.length; i += 2) {
          itemData[itemDataArray[i]] = itemDataArray[i + 1]
        }
      }

      // Close Redis connection
      redis.close()

      // Check if item exists
      if (!itemData || Object.keys(itemData).length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            message: `Item with ID '${itemId}' not found.`,
            timestamp: new Date().toISOString(),
          }),
          {
            status: 404,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        )
      }

      const response: GetItemResponse = {
        success: true,
        message: 'Item retrieved successfully.',
        item: {
          id: (itemData.id || itemData['id'] || itemId) as string,
          title: (itemData.title || itemData['title'] || '') as string,
          content: (itemData.content || itemData['content'] || '') as string,
          category: (itemData.category ||
            itemData['category'] ||
            'General') as string,
          createdAt: (itemData.createdAt ||
            itemData['createdAt'] ||
            '') as string,
          updatedAt: (itemData.updatedAt ||
            itemData['updatedAt'] ||
            '') as string,
        },
        timestamp: new Date().toISOString(),
      }

      return new Response(JSON.stringify(response, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      })
    } catch (error) {
      console.error('Error retrieving item from Redis:', error)

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to retrieve item from Redis database.',
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
