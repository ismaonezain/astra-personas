import { NextRequest, NextResponse } from 'next/server';

/**
 * Generate gothic dark fantasy NFT image based on Farcaster profile
 * Creates supernatural anime character images
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as { prompt: string; fid: number; pfpUrl?: string };
    const { prompt, fid, pfpUrl } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Use the detailed prompt directly from generate-nft
    // This ensures UNIQUE character generation, not copying any reference
    const simplifiedPrompt = prompt;

    // Direct call to OpenAI API (server-side, not using proxy)
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer `,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: simplifiedPrompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Image generation failed:', errorData);
      
      // Fallback to deterministic avatar based on FID
      const fallbackUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${fid}&backgroundColor=b6e3f4,c0aede,d1d4f9&size=512`;
      return NextResponse.json({ imageUrl: fallbackUrl });
    }

    const data = await response.json();
    
    if (data?.data?.[0]?.url) {
      return NextResponse.json({ imageUrl: data.data[0].url });
    }

    // Fallback if no URL in response
    const fallbackUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=${fid}&backgroundColor=b6e3f4,c0aede,d1d4f9&size=512`;
    return NextResponse.json({ imageUrl: fallbackUrl });

  } catch (error) {
    console.error('Image generation error:', error);
    
    // Parse FID from body if available (need to handle this carefully since body was already consumed)
    const fallbackUrl = `https://api.dicebear.com/7.x/bottts/svg?seed=0&backgroundColor=b6e3f4,c0aede,d1d4f9&size=512`;
    
    return NextResponse.json({ imageUrl: fallbackUrl });
  }
}
