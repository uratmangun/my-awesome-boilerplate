// Main entry point for Deno Deploy - routes to all functions
import addItemFunction from './functions/add-item.ts'
import getItemFunction from './functions/get-item.ts'
import deleteItemFunction from './functions/delete-item.ts'
import searchItemsFunction from './functions/search-items.ts'
import initIndexFunction from './functions/init-index.ts'
import listItemsByUrlFunction from './functions/list-items-by-url.ts'

// Function registry - add new functions here
const functions = {
  'add-item': addItemFunction,
  'get-item': getItemFunction,
  'delete-item': deleteItemFunction,
  'search-items': searchItemsFunction,
  'init-index': initIndexFunction,
  'list-items-by-url': listItemsByUrlFunction,
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    // Common CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    }

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 200,
        headers: corsHeaders,
      })
    }

    // Extract function name from path
    // Supports /api/hello, /hello, /functions/hello patterns
    const pathParts = url.pathname.split('/').filter(part => part.length > 0)
    let functionName = ''

    if (
      pathParts.length >= 2 &&
      (pathParts[0] === 'api' || pathParts[0] === 'functions')
    ) {
      // /api/hello or /functions/hello pattern
      functionName = pathParts[1]
    } else if (pathParts.length >= 1) {
      // /hello pattern
      functionName = pathParts[0]
    }

    // Route to the appropriate function
    if (functionName && functions[functionName as keyof typeof functions]) {
      const targetFunction = functions[functionName as keyof typeof functions]
      return await targetFunction.fetch(request)
    }

    // Handle root path - return available functions
    if (url.pathname === '/' || url.pathname === '/api') {
      const availableFunctions = Object.keys(functions)
      const response = {
        message: 'Deno Deploy Function Router',
        availableFunctions,
        usage: availableFunctions.map(name => ({
          function: name,
          endpoints: [`${url.origin}/api/${name}`, `${url.origin}/${name}`],
        })),
        timestamp: new Date().toISOString(),
      }

      return new Response(JSON.stringify(response, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      })
    }

    // 404 for unknown routes
    return new Response(
      JSON.stringify({
        error: 'Function not found',
        availableFunctions: Object.keys(functions),
        requestedPath: url.pathname,
      }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    )
  },
}
