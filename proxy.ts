import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Routes publiques (confirmation)
  const isPublicRoute = request.nextUrl.pathname.startsWith('/c/');
  
  // Route de login
  const isLoginRoute = request.nextUrl.pathname === '/login';
  
  // API routes publiques
  const isPublicApi = 
    request.nextUrl.pathname.startsWith('/api/confirm/');

  // Si c'est une route publique, laisser passer
  if (isPublicRoute || isPublicApi) {
    return response;
  }

  // Si l'utilisateur n'est pas connecté et essaie d'accéder à une route protégée
  if (!user && !isLoginRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si l'utilisateur est connecté, vérifier qu'il est actif
  if (user && !isLoginRoute) {
    const { data: userData } = await supabase
      .from('users')
      .select('is_active')
      .eq('id', user.id)
      .single();

    if (!userData?.is_active) {
      await supabase.auth.signOut();
      return NextResponse.redirect(new URL('/login?error=inactive', request.url));
    }
  }

  // Si l'utilisateur est connecté et essaie d'accéder à la page de login
  if (user && isLoginRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
