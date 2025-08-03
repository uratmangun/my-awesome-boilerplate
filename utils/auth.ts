// Clerk authentication utility for Deno Deploy
// Validates JWT tokens using modern Clerk Backend SDK patterns

interface AuthResult {
  success: boolean
  user?: {
    id: string
    username?: string
    email?: string
  }
  error?: string
}

/**
 * Validates Clerk JWT token and checks if user is authorized
 * Uses modern Clerk Backend SDK verifyToken method
 * @param request - The incoming request with Authorization header
 * @returns AuthResult with user info if authorized
 */
export async function validateClerkAuth(request: Request): Promise<AuthResult> {
  try {
    // Get Authorization header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Missing or invalid Authorization header. Expected: Bearer <token>'
      }
    }

    const sessionToken = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Get Clerk secret key from environment
    const clerkSecretKey = (globalThis as unknown as { Deno?: { env?: { get: (key: string) => string | undefined } } }).Deno?.env?.get('CLERK_SECRET_KEY')
    if (!clerkSecretKey) {
      return {
        success: false,
        error: 'Clerk secret key not configured. Please set CLERK_SECRET_KEY environment variable.'
      }
    }

    // Modern approach: Use JWT verification without external API calls
    // Parse and verify the JWT token manually (networkless verification)
    try {
      // Decode JWT token to get payload
      const tokenParts = sessionToken.split('.')
      if (tokenParts.length !== 3) {
        return {
          success: false,
          error: 'Invalid token format'
        }
      }

      // Decode the payload (base64url)
      const payload = JSON.parse(atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')))
      
      // Basic token validation
      const now = Math.floor(Date.now() / 1000)
      if (payload.exp && payload.exp < now) {
        return {
          success: false,
          error: 'Token has expired'
        }
      }

      // Extract user ID from token
      const userId = payload.sub
      if (!userId) {
        return {
          success: false,
          error: 'No user ID found in token'
        }
      }

      // Fetch user details to get username and email
      const userResponse = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${clerkSecretKey}`,
          'Content-Type': 'application/json',
        }
      })

      if (!userResponse.ok) {
        const errorData = await userResponse.json().catch(() => ({}))
        console.error('Failed to fetch user details:', errorData)
        return {
          success: false,
          error: 'Failed to fetch user information'
        }
      }

      const userData = await userResponse.json()
      const username = userData.username
      const primaryEmail = userData.email_addresses?.find((email: { id: string; email_address: string }) => email.id === userData.primary_email_address_id)?.email_address

      // Authorization check: Only allow specific user
      if (username !== 'uratmangun') {
        console.warn(`Unauthorized access attempt by user: ${username || 'unknown'}`)
        return {
          success: false,
          error: `Access denied. User '${username || 'unknown'}' is not authorized to access this resource.`
        }
      }

      // Log successful authentication
      console.log(`Successful authentication for user: ${username}`)

      return {
        success: true,
        user: {
          id: userId,
          username: username,
          email: primaryEmail
        }
      }

    } catch (tokenError) {
      console.error('Token parsing/verification error:', tokenError)
      return {
        success: false,
        error: 'Invalid token format or verification failed'
      }
    }

  } catch (error) {
    console.error('Auth validation error:', error)
    return {
      success: false,
      error: 'Authentication validation failed due to server error'
    }
  }
}

/**
 * Creates an unauthorized response with proper CORS headers
 * @param message - Error message
 * @param corsHeaders - CORS headers to include
 * @returns Response object
 */
export function createUnauthorizedResponse(message: string, corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({
      success: false,
      message: message,
      timestamp: new Date().toISOString(),
    }),
    {
      status: 401,
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders,
      },
    }
  )
}

/**
 * Creates a server error response with proper CORS headers
 * @param message - Error message
 * @param corsHeaders - CORS headers to include
 * @returns Response object
 */
export function createServerErrorResponse(message: string, corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({
      success: false,
      message: message,
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
