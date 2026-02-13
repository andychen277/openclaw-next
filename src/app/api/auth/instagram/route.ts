import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    // 重定向到 Instagram OAuth (使用 Facebook Graph API)
    const clientId = process.env.IG_APP_ID;
    const redirectUri = process.env.IG_REDIRECT_URI;
    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri!)}&scope=instagram_basic,instagram_content_publish&response_type=code`;

    return NextResponse.redirect(authUrl);
  }

  // 交換 access token
  try {
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${process.env.IG_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(process.env.IG_REDIRECT_URI!)}&` +
      `client_secret=${process.env.IG_APP_SECRET}&` +
      `code=${code}`
    );

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const { access_token } = await tokenResponse.json();

    // 存儲到 httpOnly cookie
    const response = NextResponse.redirect(new URL('/?auth=instagram_success', request.url));
    const cookieStore = await cookies();
    cookieStore.set('instagram_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 60, // 60 天
    });

    return response;
  } catch (error) {
    console.error('Instagram OAuth error:', error);
    return NextResponse.redirect(new URL('/?auth=instagram_error', request.url));
  }
}
