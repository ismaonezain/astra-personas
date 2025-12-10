import { NextRequest, NextResponse } from 'next/server';
import { aiChat } from '@/lib/thirdweb/thirdweb-chat-api';

/**
 * Deploy Astral Vices NFT Collection Contract
 * Uses Thirdweb AI to deploy ERC-721 contract on Base
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as { from: string };
    const { from } = body;

    if (!from) {
      return NextResponse.json(
        { error: 'Wallet address required' },
        { status: 400 }
      );
    }

    // Deploy NFT collection contract via Thirdweb AI
    const response = await aiChat({
      messages: [
        {
          role: 'user',
          content: `Deploy an ERC-721 NFT collection contract named "Astral Vices" with symbol "ASTRAL" on Base blockchain. 
          The contract should support minting with metadata URIs and have these settings:
          - Mint price: 0.0003 ETH per NFT (goes to contract owner)
          - Royalty recipient: 0x4e3636884008f3FafC845431c3f320F6430265F7
          - Royalty percentage: 5% (500 basis points) for secondary sales on OpenSea
          Make it mintable by anyone who pays the mint fee.`,
        },
      ],
      context: {
        from: from,
        chain_ids: [8453], // Base mainnet
      },
      stream: false,
    });

    return NextResponse.json({
      message: response.message,
      actions: response.actions,
      session_id: response.session_id,
      request_id: response.request_id,
    });
  } catch (error) {
    console.error('Contract deployment error:', error);
    return NextResponse.json(
      { error: 'Failed to deploy contract' },
      { status: 500 }
    );
  }
}
