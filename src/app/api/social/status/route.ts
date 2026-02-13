import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();

    const status = {
      facebook: !!cookieStore.get('facebook_token')?.value,
      instagram: !!cookieStore.get('instagram_token')?.value,
      threads: !!cookieStore.get('threads_token')?.value,
      twitter: !!cookieStore.get('twitter_token')?.value,
    };

    return NextResponse.json(status);
  } catch (error) {
    console.error('Failed to check auth status:', error);
    return NextResponse.json(
      { error: 'Failed to check auth status' },
      { status: 500 }
    );
  }
}
