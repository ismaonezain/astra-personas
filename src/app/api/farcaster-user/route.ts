import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fid = searchParams.get('fid');

    if (!fid) {
      return NextResponse.json(
        { error: 'FID parameter is required' },
        { status: 400 }
      );
    }

    // Query Farcaster Hub API for user data
    const hubResponse = await fetch(
      `https://hub.pinata.cloud/v1/castsByFid?fid=${fid}&pageSize=1`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!hubResponse.ok) {
      console.error('Failed to fetch from Farcaster Hub:', hubResponse.statusText);
      return NextResponse.json(
        { 
          fid: parseInt(fid, 10),
          username: 'farcaster-user',
          displayName: `User ${fid}`,
          pfpUrl: '',
        },
        { status: 200 }
      );
    }

    const hubData = await hubResponse.json();
    
    // Extract user data from hub response
    let username = 'farcaster-user';
    let displayName = `User ${fid}`;
    let pfpUrl = '';

    if (hubData.messages && hubData.messages.length > 0) {
      const firstCast = hubData.messages[0];
      if (firstCast.data?.castAddBody?.mentions) {
        // Try to extract user info from cast data
        username = firstCast.data.fid ? `fid-${firstCast.data.fid}` : username;
      }
    }

    // Alternative: Query Warpcast API for more complete user data
    try {
      const warpcastResponse = await fetch(
        `https://api.warpcast.com/v2/user?fid=${fid}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (warpcastResponse.ok) {
        const warpcastData = await warpcastResponse.json();
        if (warpcastData.result?.user) {
          username = warpcastData.result.user.username || username;
          displayName = warpcastData.result.user.displayName || displayName;
          pfpUrl = warpcastData.result.user.pfp?.url || pfpUrl;
        }
      }
    } catch (error) {
      console.error('Warpcast API error:', error);
    }

    return NextResponse.json({
      fid: parseInt(fid, 10),
      username,
      displayName,
      pfpUrl,
    });

  } catch (error) {
    console.error('Error fetching Farcaster user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}
