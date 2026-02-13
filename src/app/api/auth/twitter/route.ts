import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    // 重定向到 Twitter OAuth 2.0
    const clientId = process.env.TWITTER_CLIENT_ID;
    const redirectUri = process.env.TWITTER_REDIRECT_URI;
    const state = Math.random().toString(36).substring(7);
    const codeChallenge = 'challenge'; // 實際應用中應使用 PKCE

    const authUrl = `https://twitter.com/i/oauth2/authorize?` +
      `response_type=code&` +
      `client_id=${clientId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri!)}&` +
      `scope=tweet.read%20tweet.write%20users.read&` +
      `state=${state}&` +
      `code_challenge=${codeChallenge}&` +
      `code_challenge_method=plain`;

    return NextResponse.redirect(authUrl);
  }

  // 交換 access token
  try {
    const tokenResponse = await fetch('https://api.twitter.com/2/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.TWITTER_CLIENT_ID}:${process.env.TWITTER_CLIENT_SECRET}`).toString('base64')}`,
      },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.TWITTER_REDIRECT_URI!,
        code_verifier: 'challenge',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Failed to exchange code for token');
    }

    const { access_token } = await tokenResponse.json();

    // 存儲到 httpOnly cookie
    const response = NextResponse.redirect(new URL('/?auth=twitter_success', request.url));
    const cookieStore = await cookies();
    cookieStore.set('twitter_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 60, // 60 天
    });

    return response;
  } catch (error) {
    console.error('Twitter OAuth error:', error);
    return NextResponse.redirect(new URL('/?auth=twitter_error', request.url));
  }
}
