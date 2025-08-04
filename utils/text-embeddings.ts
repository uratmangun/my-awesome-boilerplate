// Text embedding generation utility using Nomic embeddings
// Based on the Redis vector similarity search guide
interface EmbeddingResponse {
  embeddings: number[]
  error?: string
}

/**
 * Generate sentence embeddings using Transformers.js
 * Uses the Xenova/all-distilroberta-v1 model for 768-dimensional embeddings
 */
export async function generateTextEmbeddings(
  text: string
): Promise<EmbeddingResponse> {
  try {
    const embeddings = await generateSentenceEmbeddings(text)

    return {
      embeddings,
    }
  } catch (error) {
    console.error('Error generating embeddings:', error)
    // Fallback to mock embeddings if Nomic API fails
    const mockEmbeddings = createMockEmbeddings(text)
    return {
      embeddings: mockEmbeddings,
      error: `Nomic API failed, using mock embeddings: ${error.message}`,
    }
  }
}

/**
 * Generate sentence embeddings using Nomic API
 * Uses the nomic-embed-text-v1.5 model for high-quality embeddings
 */
async function generateSentenceEmbeddings(sentence: string): Promise<number[]> {
  try {
    // Get API key from environment
    const apiKey = Deno.env.get('NOMIC_API_KEY')
    if (!apiKey) {
      throw new Error('NOMIC_API_KEY environment variable is required')
    }

    const url = "https://api-atlas.nomic.ai/v1/embedding/text"
    
    const body = {
      texts: [sentence],
      model: "nomic-embed-text-v1.5",
      task_type: "search_document"
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body)
    })

    if (!response.ok) {
      throw new Error(`Nomic API request failed: ${response.status} ${response.statusText}`)
    }

    const result = await response.json()
    
    if (!result.embeddings || result.embeddings.length === 0) {
      throw new Error('Failed to generate embeddings from Nomic API')
    }

    return result.embeddings[0]
  } catch (error) {
    console.error('Nomic embedding generation failed:', error)
    throw new Error(`Nomic embedding failed: ${error.message}`)
  }
}

/**
 * Create mock embeddings based on text content
 * This creates a 768-dimensional vector to match Nomic's embedding dimensions
 * Used as fallback when Nomic API is unavailable
 */
function createMockEmbeddings(text: string): number[] {
  const dimension = 768 // Nomic embeddings produce 768-dimensional embeddings
  const embeddings: number[] = []

  // Create a simple hash-based embedding
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }

  // Generate embeddings based on text characteristics
  for (let i = 0; i < dimension; i++) {
    // Use text length, character codes, and position to create varied values
    const seed = hash + i + text.length
    const value =
      (Math.sin(seed) * Math.cos(seed * 0.1) + Math.sin(seed * 0.01)) * 0.1
    embeddings.push(parseFloat(value.toFixed(6)))
  }

  // Normalize the vector (important for cosine similarity)
  const magnitude = Math.sqrt(
    embeddings.reduce((sum, val) => sum + val * val, 0)
  )
  if (magnitude > 0) {
    for (let i = 0; i < embeddings.length; i++) {
      embeddings[i] = embeddings[i] / magnitude
    }
  }

  return embeddings
}

/**
 * Convert number array to Float32Array buffer for Redis
 */
export function float32Buffer(arr: number[]): Uint8Array {
  const float32Array = new Float32Array(arr)
  return new Uint8Array(float32Array.buffer)
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    throw new Error('Vectors must have the same dimension')
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}
