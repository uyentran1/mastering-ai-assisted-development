import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET
const AUTH_COOKIE_NAME = 'auth_token'
const LOGIN_PATH = '/login'

async function isValidToken(token: string): Promise<boolean> {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set')
  }

  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(JWT_SECRET)
    )

    // jwtVerify already rejects expired tokens (via the 'exp' claim),
    // but we check explicitly to fail closed if that behavior ever changes.
    if (typeof payload.exp === 'number' && payload.exp * 1000 < Date.now()) {
      return false
    }

    return true
  } catch {
    return false
  }
}

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value

  if (!token || !(await isValidToken(token))) {
    const loginUrl = new URL(LOGIN_PATH, request.url)
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - /login (the login page itself, to avoid a redirect loop)
     * - /api (API routes)
     * - /_next/static, /_next/image (Next.js internals)
     * - favicon.ico (metadata file)
     */
    '/((?!login|api|_next/static|_next/image|favicon.ico).*)',
  ],
}
