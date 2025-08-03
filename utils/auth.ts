// Clerk authentication utility for Deno Deploy
// Validates JWT tokens and checks user authorization using modern Clerk backend patterns

interface ClerkJWTPayload {
  sub: string // User ID
  username?: string
  email?: string
  iat: number
  exp: number
  iss: string
  aud: string
}

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
 * Uses modern Clerk backend authentication patterns
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
    const clerkSecretKey = (globalThis as any).Deno?.env?.get('CLERK_SECRET_KEY')
    if (!clerkSecretKey) {
      return {
        success: false,
        error: 'Clerk secret key not configured. Please set CLERK_SECRET_KEY environment variable.'
      }
    }

    // Verify JWT token using Clerk's verifyToken method
    // This is more secure and follows Clerk's recommended backend patterns
    const verifyUrl = `https://api.clerk.com/v1/sessions/verify`
    const verifyResponse = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${clerkSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: sessionToken
      })
    })

    if (!verifyResponse.ok) {
      const errorData = await verifyResponse.json().catch(() => ({}))
      console.error('Token verification failed:', errorData)
      return {
        success: false,
        error: 'Invalid or expired session token'
      }
    }

    const sessionData = await verifyResponse.json()
    
    // Get user information from session
    const userId = sessionData.user_id
    if (!userId) {
      return {
        success: false,
        error: 'No user ID found in session'
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
    const primaryEmail = userData.email_addresses?.find((email: any) => email.id === userData.primary_email_address_id)?.email_address

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
