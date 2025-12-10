import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CONTRACT_ADDRESS = '0x73eEdD8a06a84aA28cF6A871556BeF70935E2D86';
const BASE_RPC = 'https://mainnet.base.org';

const ABI = [
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Call totalSupply function on contract
    const response = await fetch(BASE_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [
          {
            to: CONTRACT_ADDRESS,
            data: '0x18160ddd' // totalSupply() function selector
          },
          'latest'
        ]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch from RPC');
    }

    const data = await response.json() as { result: string };
    const totalSupply = parseInt(data.result, 16);

    return NextResponse.json({ 
      totalSupply,
      maxSupply: 3000,
      remaining: 3000 - totalSupply
    });
  } catch (error) {
    console.error('Error fetching contract stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contract stats' },
      { status: 500 }
    );
  }
}
