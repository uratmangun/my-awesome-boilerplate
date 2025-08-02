// Text embedding generation utility using Google GenAI
// Based on the Redis vector similarity search guide
import { GoogleGenAI } from 'npm:@google/genai'
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
    // Fallback to mock embeddings if Google AI fails
    const mockEmbeddings = createMockEmbeddings(text)
    return {
      embeddings: mockEmbeddings,
      error: `Google AI failed, using mock embeddings: ${error.message}`,
    }
  }
}

/**
 * Generate sentence embeddings using Google GenAI
 * Uses the gemini-embedding-001 model for high-quality embeddings
 */
async function generateSentenceEmbeddings(sentence: string): Promise<number[]> {
  try {
    // Get API key from environment
    const apiKey = Deno.env.get('GOOGLE_AI_API_KEY')
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY environment variable is required')
    }

    // Initialize Google GenAI
    const ai = new GoogleGenAI({ apiKey })

    // Generate embeddings using the embedding model
    const response = await ai.models.embedContent({
      model: 'gemini-embedding-001',
      contents: sentence,
    })

    if (!response.embeddings || response.embeddings.length === 0) {
      throw new Error('Failed to generate embeddings from Google GenAI')
    }

    return response.embeddings[0].values
  } catch (error) {
    console.error('Google GenAI embedding generation failed:', error)
    throw new Error(`Google GenAI embedding failed: ${error.message}`)
  }
}

/**
 * Create mock embeddings based on text content
 * This creates a 768-dimensional vector to match Google's text-embedding-004
 * Used as fallback when Google AI API is unavailable
 */
function createMockEmbeddings(text: string): number[] {
  const dimension = 768 // Google text-embedding-004 produces 768-dimensional embeddings
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
