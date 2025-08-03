// Deno function to get a specific item from Redis database
import { connect } from 'https://deno.land/x/redis@v0.32.3/mod.ts'
import { validateClerkAuth, createUnauthorizedResponse, createServerErrorResponse } from '../utils/auth.ts'

interface GetItemRequest {
  id: string
}

interface GetItemResponse {
  success: boolean
  message: string
  item?: {
    id: string
    github_description: string
    github_repository_name: string
    homepage_url: string
    url: string
    createdAt: string
    updatedAt: string
  }
  timestamp: string
}

export default {
  async fetch(request: Request): Promise<Response> {
    // Handle CORS for development with Authorization support
    const origin = request.headers.get('Origin') || ''
    const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', 'https://your-production-domain.com']
    const corsOrigin = allowedOrigins.includes(origin) ? origin : 'http://localhost:5173'
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Accept, Accept-Language, Content-Language, Content-Type, Authorization, authorization, X-Requested-With, Origin, Access-Control-Request-Method, Access-Control-Request-Headers',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
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

    // Validate authentication
    const authResult = await validateClerkAuth(request)
    if (!authResult.success) {
      return createUnauthorizedResponse(
        authResult.error || 'Authentication required',
        corsHeaders
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
        message: 'GitHub repository item retrieved successfully.',
        item: {
          id: (itemData.id || itemData['id'] || itemId) as string,
          github_description: (itemData.github_description || itemData['github_description'] || '') as string,
          github_repository_name: (itemData.github_repository_name || itemData['github_repository_name'] || '') as string,
          homepage_url: (itemData.homepage_url || itemData['homepage_url'] || '') as string,
          url: (itemData.url || itemData['url'] || '') as string,
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
