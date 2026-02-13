import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

interface PostRequest {
  platforms: string[];
  content: string;
  media?: string[];
}

async function postToFacebook(content: string, media: string[], token: string) {
  const pageId = process.env.FB_PAGE_ID;
  const url = media.length > 0
    ? `https://graph.facebook.com/v18.0/${pageId}/photos`
    : `https://graph.facebook.com/v18.0/${pageId}/feed`;

  const body = media.length > 0
    ? { url: media[0], message: content, access_token: token }
    : { message: content, access_token: token };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return {
    platform: 'facebook',
    success: response.ok,
    postId: response.ok ? (await response.json()).id : undefined,
    error: response.ok ? undefined : await response.text(),
  };
}

async function postToInstagram(content: string, media: string[], token: string) {
  if (media.length === 0) {
    return { platform: 'instagram', success: false, error: 'Instagram requires image' };
  }

  const accountId = process.env.IG_BUSINESS_ACCOUNT_ID;

  // Step 1: 創建 media object
  const createResponse = await fetch(
    `https://graph.instagram.com/v18.0/${accountId}/media`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image_url: media[0],
        caption: content,
        access_token: token,
      }),
    }
  );

  if (!createResponse.ok) {
    return { platform: 'instagram', success: false, error: await createResponse.text() };
  }

  const { id: creationId } = await createResponse.json();

  // Step 2: 發布 media
  const publishResponse = await fetch(
    `https://graph.instagram.com/v18.0/${accountId}/media_publish`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creation_id: creationId,
        access_token: token,
      }),
    }
  );

  return {
    platform: 'instagram',
    success: publishResponse.ok,
    postId: publishResponse.ok ? (await publishResponse.json()).id : undefined,
    error: publishResponse.ok ? undefined : await publishResponse.text(),
  };
}

async function postToThreads(content: string, token: string) {
  // Threads API (使用 Facebook Graph API)
  const response = await fetch('https://graph.threads.com/v18.0/me/threads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      media_type: 'TEXT',
      text: content,
      access_token: token,
    }),
  });

  return {
    platform: 'threads',
    success: response.ok,
    postId: response.ok ? (await response.json()).id : undefined,
    error: response.ok ? undefined : await response.text(),
  };
}

async function postToTwitter(content: string, media: string[], token: string) {
  const response = await fetch('https://api.twitter.com/2/tweets', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: content,
      // media: media.length > 0 ? { media_ids: media } : undefined,
    }),
  });

  return {
    platform: 'twitter',
    success: response.ok,
    postId: response.ok ? (await response.json()).data.id : undefined,
    error: response.ok ? undefined : await response.text(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: PostRequest = await request.json();
    const { platforms, content, media = [] } = body;

    if (!platforms || platforms.length === 0) {
      return NextResponse.json({ error: 'No platforms specified' }, { status: 400 });
    }

    if (!content) {
      return NextResponse.json({ error: 'No content provided' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const results = await Promise.all(
      platforms.map(async (platform) => {
        const token = cookieStore.get(`${platform}_token`)?.value;

        if (!token) {
          return { platform, success: false, error: 'Not authenticated' };
        }

        try {
          switch (platform) {
            case 'facebook':
              return await postToFacebook(content, media, token);
            case 'instagram':
              return await postToInstagram(content, media, token);
            case 'threads':
              return await postToThreads(content, token);
            case 'twitter':
              return await postToTwitter(content, media, token);
            default:
              return { platform, success: false, error: 'Unknown platform' };
          }
        } catch (error) {
          return {
            platform,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Social post error:', error);
    return NextResponse.json(
      { error: 'Failed to post to social media' },
      { status: 500 }
    );
  }
}
