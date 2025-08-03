// Deno function to list all items filtered by URL (domain name)
import { connect } from 'https://deno.land/x/redis@v0.32.3/mod.ts'

interface ListItemsByUrlRequest {
  url: string // Domain name to filter by (e.g., example.com)
  limit?: number // Maximum number of results (default: 50)
}

interface ListItemsByUrlResponse {
  success: boolean
  message: string
  results?: {
    total: number
    items: Array<{
      id: string
      github_description: string
      github_repository_name: string
      homepage_url: string
      url: string
      is_template: boolean
      createdAt: string
      updatedAt: string
    }>
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
          message: 'Method not allowed. Use GET or POST to list items by URL.',
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
      let requestParams: ListItemsByUrlRequest

      // Parse request parameters
      if (request.method === 'GET') {
        const url = new URL(request.url)
        requestParams = {
          url: url.searchParams.get('url') || '',
          limit: parseInt(url.searchParams.get('limit') || '50'),
        }
      } else {
        const body = await request.json()
        requestParams = {
          url: body.url || '',
          limit: body.limit || 50,
        }
      }

      // Validate required fields
      if (!requestParams.url.trim()) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'URL parameter is required.',
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

      // Filter items by URL and collect matching items
      const items: Array<{
        id: string
        github_description: string
        github_repository_name: string
        homepage_url: string
        url: string
        is_template: boolean
        createdAt: string
        updatedAt: string
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

          // Check if this item matches the requested URL
          if (itemData.url === requestParams.url) {
            items.push({
              id: itemKey,
              github_description: itemData.github_description || '',
              github_repository_name: itemData.github_repository_name || '',
              homepage_url: itemData.homepage_url || '',
              url: itemData.url || '',
              is_template: itemData.is_template === 'true', // Convert string to boolean
              createdAt: itemData.createdAt || '',
              updatedAt: itemData.updatedAt || '',
            })
          }
        } catch (itemError) {
          console.warn(`Error processing item ${itemKey}:`, itemError)
          continue
        }
      }

      // Sort by creation date (newest first) and limit results
      const sortedItems = items
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, requestParams.limit)

      // Close Redis connection
      redis.close()

      const response: ListItemsByUrlResponse = {
        success: true,
        message: `Found ${sortedItems.length} items for URL: ${requestParams.url}`,
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
      console.error('Error listing items by URL:', error)

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to list items by URL from Redis database.',
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
