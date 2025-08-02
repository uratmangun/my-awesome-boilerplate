// Deno function to delete a specific item from Redis database
import { connect } from 'https://deno.land/x/redis@v0.32.3/mod.ts'

interface DeleteItemRequest {
  id: string
}

interface DeleteItemResponse {
  success: boolean
  message: string
  deletedItem?: {
    id: string
    title: string
    content: string
    category: string
  }
  timestamp: string
}

export default {
  async fetch(request: Request): Promise<Response> {
    // Handle CORS for development
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'DELETE, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
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
        title: itemData.title || '',
        content: itemData.content || '',
        category: itemData.category || '',
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
        // Remove from title index
        await redis.srem('search:titles', itemId)
        // Remove from content index
        await redis.srem('search:contents', itemId)
        // Remove from category index
        await redis.srem(
          `search:category:${deletedItem.category.toLowerCase()}`,
          itemId
        )
      } catch (indexError) {
        // Index cleanup errors are not critical
        console.warn('Warning: Could not clean up search indexes:', indexError)
      }

      await redis.quit()

      const response: DeleteItemResponse = {
        success: true,
        message: `Item '${deletedItem.title}' deleted successfully`,
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
