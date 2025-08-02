// Deno function to initialize Redis search index for vector similarity
import { createItemsIndex, checkIndexExists } from '../utils/redis-index.ts'

interface InitIndexResponse {
  success: boolean
  message: string
  indexExists?: boolean
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

    // Only allow POST requests for initialization
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({
          success: false,
          message:
            'Method not allowed. Use POST to initialize the search index.',
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

      // Check if index already exists
      const indexExists = await checkIndexExists({ redisUrl })

      if (indexExists) {
        return new Response(
          JSON.stringify({
            success: true,
            message:
              'Redis search index already exists and is ready for vector similarity search.',
            indexExists: true,
            timestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
              ...corsHeaders,
            },
          }
        )
      }

      // Create the index with simplified command
      await createItemsIndex({ redisUrl })

      const response: InitIndexResponse = {
        success: true,
        message:
          'Redis search index created successfully. Vector similarity search is now enabled.',
        indexExists: false,
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
      console.error('Error initializing Redis index:', error)

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to initialize Redis search index.',
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
