// Deno function to delete a specific item from Redis database
import { connect } from 'https://deno.land/x/redis@v0.32.3/mod.ts'
import { validateClerkAuth, createUnauthorizedResponse, createServerErrorResponse } from '../utils/auth.ts'

interface DeleteItemRequest {
  id: string
}

interface DeleteItemResponse {
  success: boolean
  message: string
  deletedItem?: {
    id: string
    github_description: string
    github_repository_name: string
    homepage_url: string
    url: string
  }
  timestamp: string
}

export default {
  async fetch(request: Request): Promise<Response> {
    // Enhanced CORS handler with Authorization support
    const origin = request.headers.get('Origin') || ''
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', 'https://your-production-domain.com']
    const corsOrigin = allowedOrigins.includes(origin) ? origin : 'http://localhost:5173'
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': 'Accept, Accept-Language, Content-Language, Content-Type, Authorization, authorization, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    }

    // Handle preflight requests (OPTIONS)
    if (request.method === 'OPTIONS') {
      console.log('Handling CORS preflight request')
      console.log('Request headers:', Object.fromEntries(request.headers.entries()))
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      })
    }

    // Allow both DELETE and POST requests
    if (request.method !== 'DELETE' && request.method !== 'POST') {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Method not allowed. Use DELETE or POST to delete an item.',
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

    // Validate authentication
    const authResult = await validateClerkAuth(request)
    if (!authResult.success) {
      return createUnauthorizedResponse(
        authResult.error || 'Authentication required',
        corsHeaders
      )
    }

    try {
      let itemId: string

      // Handle different request methods
      if (request.method === 'DELETE') {
        // For DELETE requests, get ID from query parameters
        const url = new URL(request.url)
        itemId = url.searchParams.get('id') || ''
      } else {
        // For POST requests, get ID from request body
        const body: DeleteItemRequest = await request.json()
        itemId = body.id
      }

      // Validate input
      if (!itemId || itemId.trim() === '') {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Item ID is required',
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

      // First, get the item to return its data before deletion
      const itemDataArray = await redis.hgetall(itemId)
      let itemData: Record<string, string> | null = null

      if (itemDataArray && itemDataArray.length > 0) {
        // Convert Redis array response to object
        itemData = {}
        for (let i = 0; i < itemDataArray.length; i += 2) {
          itemData[itemDataArray[i]] = itemDataArray[i + 1]
        }
      }

      if (!itemData) {
        await redis.quit()
        return new Response(
          JSON.stringify({
            success: false,
            message: `Item with ID '${itemId}' not found`,
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

      // Store the item data before deletion
      const deletedItem = {
        id: itemId,
        github_description: itemData.github_description || '',
        github_repository_name: itemData.github_repository_name || '',
        homepage_url: itemData.homepage_url || '',
        url: itemData.url || '',
      }

      // Delete the item from Redis hash
      const deletedCount = await redis.del(itemId)

      if (deletedCount === 0) {
        await redis.quit()
        return new Response(
          JSON.stringify({
            success: false,
            message: `Failed to delete item with ID '${itemId}'`,
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

      // Also remove from search indexes if they exist
      try {
        // Remove from description index
        await redis.srem('search:descriptions', itemId)
        // Remove from repository index
        await redis.srem('search:repositories', itemId)
      } catch (indexError) {
        // Index cleanup errors are not critical
        console.warn('Warning: Could not clean up search indexes:', indexError)
      }

      await redis.quit()

      const response: DeleteItemResponse = {
        success: true,
        message: `GitHub repository '${deletedItem.github_repository_name}' deleted successfully`,
        deletedItem,
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
      console.error('Error deleting item from Redis:', error)

      return new Response(
        JSON.stringify({
          success: false,
          message:
            error instanceof Error
              ? error.message
              : 'Unknown error occurred while deleting item',
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
