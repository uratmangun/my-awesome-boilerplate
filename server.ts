// Simple Deno server for local development
import { load } from 'https://deno.land/std@0.208.0/dotenv/mod.ts'
import mainHandler from './main.ts'

// Load environment variables from .env file
try {
  const env = await load()
  // Set loaded environment variables
  for (const [key, value] of Object.entries(env)) {
    Deno.env.set(key, value)
  }
  console.log('📄 Environment variables loaded from .env file')
} catch (error) {
  console.log('⚠️  No .env file found or error loading it:', error.message)
}

const PORT = 8000

async function handler(request: Request): Promise<Response> {
  // Use the main handler which routes to all functions
  return await mainHandler.fetch(request)
}

console.log(`🦕 Deno server running on http://localhost:${PORT}`)
console.log(`📡 Function endpoint: http://localhost:${PORT}/api/hello`)

Deno.serve({ port: PORT }, handler)
