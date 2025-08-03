// Simple Deno server for local development
import mainHandler from './main.ts'

// Robust environment variable loading function
async function loadEnvVariables() {
  try {
    // Try to read .env file manually
    const envContent = await Deno.readTextFile('.env')
    const envVars: Record<string, string> = {}
    let loadedCount = 0
    
    // Parse .env file line by line
    const lines = envContent.split('\n')
    for (const line of lines) {
      const trimmedLine = line.trim()
      
      // Skip empty lines and comments (but handle commented variables specially)
      if (!trimmedLine) continue
      
      // Handle commented variables - extract the variable name and value
      if (trimmedLine.startsWith('#')) {
        const uncommented = trimmedLine.substring(1).trim()
        if (uncommented.includes('=')) {
          const [key, ...valueParts] = uncommented.split('=')
          const value = valueParts.join('=').trim()
          console.log(`   🔒 Commented variable found: ${key.trim()} (not loaded)`)
          continue // Don't load commented variables
        }
        continue // Skip other comments
      }
      
      // Parse regular variables
      if (trimmedLine.includes('=')) {
        const [key, ...valueParts] = trimmedLine.split('=')
        const value = valueParts.join('=').trim()
        const cleanKey = key.trim()
        const cleanValue = value.replace(/^["']|["']$/g, '') // Remove quotes
        
        envVars[cleanKey] = cleanValue
        Deno.env.set(cleanKey, cleanValue)
        loadedCount++
      }
    }
    
    console.log('📄 Environment variables loaded from .env file')
    console.log(`   ✅ Loaded ${loadedCount} variables:`, Object.keys(envVars).join(', '))
    return envVars
    
  } catch (error) {
    console.log('⚠️  No .env file found or error reading it:', error.message)
    console.log('   📋 Continuing with system environment variables only...')
    
    // Fallback: Try the standard dotenv library as backup
    try {
      const { load } = await import('https://deno.land/std@0.208.0/dotenv/mod.ts')
      const env = await load({ allowEmptyValues: true })
      for (const [key, value] of Object.entries(env)) {
        Deno.env.set(key, value)
      }
      console.log('   🔄 Fallback: Used standard dotenv loader')
      return env
    } catch (fallbackError) {
      console.log('   ❌ Fallback also failed:', fallbackError.message)
      return {}
    }
  }
}

// Load environment variables
await loadEnvVariables()

const PORT = 8000

async function handler(request: Request): Promise<Response> {
  // Use the main handler which routes to all functions
  return await mainHandler.fetch(request)
}

console.log(`🦕 Deno server running on http://localhost:${PORT}`)
console.log(`📡 Function endpoint: http://localhost:${PORT}/api/hello`)

Deno.serve({ port: PORT }, handler)
