import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient, http, getAddress } from 'viem';
import { optimism } from 'viem/chains';

// Farcaster ID Registry contract on Optimism
const ID_REGISTRY_ADDRESS = '';
const KEY_REGISTRY_ADDRESS = '';

// ABI for idOf function in ID Registry
const ID_REGISTRY_ABI = [
  {
    inputs: [{ name: 'owner', type: 'address' }],
    name: 'idOf',
    outputs: [{ name: 'fid', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json(
        { error: 'Address parameter is required' },
        { status: 400 }
      );
    }

    // Normalize and validate address
    let normalizedAddress: string;
    try {
      normalizedAddress = getAddress(address);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid Ethereum address' },
        { status: 400 }
      );
    }

    console.log('Querying FID for address:', normalizedAddress);

    // Method 1: Query Farcaster ID Registry contract on Optimism
    try {
      const publicClient = createPublicClient({
        chain: optimism,
        transport: http('https://mainnet.optimism.io'),
      });

      const fid = await publicClient.readContract({
        address: ID_REGISTRY_ADDRESS,
        abi: ID_REGISTRY_ABI,
        functionName: 'idOf',
        args: [normalizedAddress as `0x${string}`],
      });

      if (fid && fid > 0n) {
        console.log('FID found via ID Registry contract:', fid.toString());

        // Try to get user details from Warpcast public API
        try {
          const warpcastResponse = await fetch(
            `https://api.warpcast.com/v2/user?fid=${fid.toString()}`,
            {
              headers: {
                'Content-Type': 'application/json',
              },
            }
          );

          if (warpcastResponse.ok) {
            const warpcastData = await warpcastResponse.json();
            if (warpcastData.result?.user) {
              return NextResponse.json({
                fid: Number(fid),
                username: warpcastData.result.user.username || `user-${fid}`,
                displayName: warpcastData.result.user.displayName || `User ${fid}`,
                pfpUrl: warpcastData.result.user.pfp?.url || '',
              });
            }
          }
        } catch (warpcastError) {
          console.error('Warpcast API error:', warpcastError);
        }

        // Return basic FID data if Warpcast fails
        return NextResponse.json({
          fid: Number(fid),
          username: `user-${fid}`,
          displayName: `User ${fid}`,
          pfpUrl: '',
        });
      }
    } catch (contractError) {
      console.error('ID Registry contract error:', contractError);
    }

    // Method 2: Fallback to public Farcaster Hub API
    try {
      const hubResponse = await fetch(
        `https://hub.pinata.cloud/v1/verificationsByAddress?address=${normalizedAddress}`,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (hubResponse.ok) {
        const hubData = await hubResponse.json();

        if (hubData.messages && hubData.messages.length > 0) {
          // Extract FID from first verification message
          const firstVerification = hubData.messages[0];
          const fid = firstVerification.data?.fid;

          if (fid) {
            console.log('FID found via Hub API:', fid);

            // Try to get user details from Warpcast API
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
                  return NextResponse.json({
                    fid: fid,
                    username: warpcastData.result.user.username || `user-${fid}`,
                    displayName: warpcastData.result.user.displayName || `User ${fid}`,
                    pfpUrl: warpcastData.result.user.pfp?.url || '',
                  });
                }
              }
            } catch (warpcastError) {
              console.error('Warpcast API error:', warpcastError);
            }

            // Return basic FID data if Warpcast fails
            return NextResponse.json({
              fid: fid,
              username: `user-${fid}`,
              displayName: `User ${fid}`,
              pfpUrl: '',
            });
          }
        }
      }
    } catch (hubError) {
      console.error('Hub API error:', hubError);
    }

    // No FID found
    console.log('No FID found for wallet address');
    return NextResponse.json({
      fid: 0,
      username: 'guest',
      displayName: 'Guest User',
      pfpUrl: '',
    });

  } catch (error) {
    console.error('Error fetching FID from wallet:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FID from wallet' },
      { status: 500 }
    );
  }
}
