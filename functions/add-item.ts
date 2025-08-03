// Deno function to add items to Redis database with vector embeddings
import { connect } from 'https://deno.land/x/redis@v0.32.3/mod.ts'
import { generateTextEmbeddings } from '../utils/text-embeddings.ts'
import { validateClerkAuth, createUnauthorizedResponse } from '../utils/auth.ts'

interface AddItemRequest {
  github_repository_url: string // GitHub repository URL (e.g., https://github.com/owner/repo)
  url: string // Domain name (e.g., example.com)
}

interface AddItemResponse {
  success: boolean
  message: string
  item?: {
    id: string
    github_description: string
    github_repository_name: string
    homepage_url: string
    url: string
    is_template: boolean
    createdAt: string
    updatedAt: string
  }
  timestamp: string
}

export default {
  async fetch(request: Request): Promise<Response> {
    // Enhanced CORS handler with Authorization support
    // const origin = request.headers.get('Origin') || ''
    // const allowedOrigins = ['http://localhost:5173', 'http://localhost:3000', 'https://your-production-domain.com']
    // const corsOrigin = allowedOrigins.includes(origin) ? origin : 'http://localhost:5173'
    
    // const corsHeaders = {
    //   'Access-Control-Allow-Origin': corsOrigin,
    //   'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
    //   'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    //   'Access-Control-Max-Age': '86400',
    //   'Vary': 'Origin',
    // }
    // // Log request details
   
    // // Handle preflight requests (OPTIONS)
    // if (request.method === 'OPTIONS') {
    // Log ALL request details
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
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

    // Validate authentication
    const authResult = await validateClerkAuth(request)
    if (!authResult.success) {
      return createUnauthorizedResponse(
        authResult.error || 'Authentication required',
        corsHeaders
      )
    }

    try {
      // Parse request body
      const body: AddItemRequest = await request.json()

      // Validate required fields
      if (!body.github_repository_url || !body.url) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'github_repository_url and url are required.',
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

      // Parse GitHub repository URL to extract owner and repo name
      const githubUrlMatch = body.github_repository_url.match(/github\.com\/([^/]+)\/([^/]+)(?:\.git)?(?:\/.*)?$/)
      if (!githubUrlMatch) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Invalid GitHub repository URL format. Expected: https://github.com/owner/repo',
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

      const [, owner, repo] = githubUrlMatch

      // Fetch repository information from GitHub API
      let repoData: Record<string, unknown>
      try {
        const githubResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}`)
        if (!githubResponse.ok) {
          return new Response(
            JSON.stringify({
              success: false,
              message: `Failed to fetch repository information from GitHub: ${githubResponse.status} ${githubResponse.statusText}`,
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
        repoData = await githubResponse.json()
      } catch (_error) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Failed to connect to GitHub API',
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

      // Extract repository information
      const github_repository_name = repoData.full_name || `${owner}/${repo}`
      const github_description = repoData.description || 'No description available'
      const homepage_url = repoData.homepage || ''
      const is_template = repoData.is_template || false

      // Generate unique item ID
      const itemId = `item:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`

      // Generate vector embeddings for github_description and github_repository_name
      const descriptionEmbedding = await generateTextEmbeddings(github_description)
      const repositoryEmbedding = await generateTextEmbeddings(github_repository_name)
      const combinedText = `${github_description} ${github_repository_name}`
      const combinedEmbedding = await generateTextEmbeddings(combinedText)

      if (
        descriptionEmbedding.error ||
        repositoryEmbedding.error ||
        combinedEmbedding.error
      ) {
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Failed to generate embeddings for GitHub content.',
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
        github_description,
        github_repository_name,
        homepage_url,
        url: body.url,
        is_template,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        descriptionEmbeddings: descriptionEmbedding.embeddings,
        repositoryEmbeddings: repositoryEmbedding.embeddings,
        combinedEmbeddings: combinedEmbedding.embeddings,
      }

      // Store item in Redis using hash operations (compatible with basic Redis)
      // Convert embeddings arrays to strings for storage
      const itemData = {
        id: itemId,
        github_description,
        github_repository_name,
        homepage_url,
        url: body.url,
        is_template: is_template.toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        descriptionEmbeddings: JSON.stringify(descriptionEmbedding.embeddings),
        repositoryEmbeddings: JSON.stringify(repositoryEmbedding.embeddings),
        combinedEmbeddings: JSON.stringify(combinedEmbedding.embeddings),
      }

      // Use HSET to store the item data
      await redis.hset(itemId, itemData)

      // Close Redis connection
      redis.close()

      const response: AddItemResponse = {
        success: true,
        message: 'GitHub repository item added successfully to Redis database.',
        item: {
          id: itemId,
          github_description: item.github_description,
          github_repository_name: item.github_repository_name,
          homepage_url: item.homepage_url,
          url: item.url,
          is_template: item.is_template,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
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
