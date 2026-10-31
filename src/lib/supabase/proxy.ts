import { canAccessPath, isAppPath } from '@/lib/access';
import { findStaffByIdentity } from '@/lib/staff';
import { getSupabasePublishableEnv } from '@/lib/supabase/env';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === '/login';
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-centcare-path', pathname);

  const env = getSupabasePublishableEnv();

  if (!env) {
    if (isLogin) {
      return NextResponse.next({ request: { headers: requestHeaders } });
    }

    return NextResponse.redirect(new URL('/login', request.url));
  }

  let supabaseResponse = NextResponse.next({
    request: { headers: requestHeaders },
  });

  const supabase = createServerClient(env.url, env.key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request: { headers: requestHeaders },
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
        Object.entries(headers).forEach(([key, value]) => {
          supabaseResponse.headers.set(key, value);
        });
      },
    },
  });

  const identity = await readIdentity(supabase);

  if (!identity) {
    if (isLogin) {
      return supabaseResponse;
    }

    return redirectTo(request, '/login', supabaseResponse);
  }

  const staff = await findStaffByIdentity(identity);

  if (staff.status === 'unavailable') {
    return new NextResponse('The staff record could not be checked.', { status: 503 });
  }

  if (staff.status !== 'ok') {
    if (isLogin) {
      return supabaseResponse;
    }

    return redirectTo(request, '/login?reason=unassigned', supabaseResponse);
  }

  if (isLogin) {
    return redirectTo(request, '/', supabaseResponse);
  }

  if (isAppPath(pathname) && !canAccessPath(staff.staff.role, pathname)) {
    return redirectTo(request, '/', supabaseResponse);
  }

  return supabaseResponse;
}

async function readIdentity(supabase: ReturnType<typeof createServerClient>) {
  try {
    const { data, error } = await supabase.auth.getClaims();

    if (error || !data?.claims) {
      return null;
    }

    const userId = typeof data.claims.sub === 'string' ? data.claims.sub : null;
    const email = typeof data.claims.email === 'string' ? data.claims.email : null;

    if (!userId) {
      return null;
    }

    return { userId, email };
  } catch (error) {
    console.error('Session lookup failed', error instanceof Error ? error.name : 'Error');
    return null;
  }
}

function redirectTo(request: NextRequest, path: string, supabaseResponse: NextResponse) {
  const redirectResponse = NextResponse.redirect(new URL(path, request.url));

  supabaseResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });

  return redirectResponse;
}
