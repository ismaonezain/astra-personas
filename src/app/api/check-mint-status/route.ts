import { NextRequest, NextResponse } from 'next/server';
import { registerMintedFID } from '@/lib/mint-tracking';

// Contract address on Base
const CONTRACT_ADDRESS = '0x73eEdD8a06a84aA28cF6A871556BeF70935E2D86';
const BASE_RPC_URL = 'https://mainnet.base.org';

// Contract ABI for checking mint status
const CONTRACT_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'fidToTokenId',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ internalType: 'uint256', name: 'tokenId', type: 'uint256' }],
    name: 'tokenURI',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  }
];

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as { fid: number };
    const { fid } = body;

    if (fid === undefined || fid === null) {
      return NextResponse.json({ error: 'FID is required' }, { status: 400 });
    }

    console.log('Checking mint status for FID:', fid);

    // Call contract to check if FID has minted
    const response = await fetch(BASE_RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_call',
        params: [
          {
            to: CONTRACT_ADDRESS,
            data: `0x${encodeFunctionCall('fidToTokenId', [fid])}`,
          },
          'latest'
        ]
      })
    });

    const data = await response.json() as { result?: string; error?: { message: string } };

    if (data.error) {
      console.error('RPC error:', data.error);
      return NextResponse.json({ hasMinted: false });
    }

    // Parse the result - if tokenId > 0, then FID has minted
    const result = data.result || '0x0';
    const tokenId = BigInt(result);

    console.log('Token ID for FID', fid, ':', tokenId.toString());

    if (tokenId > 0n) {
      // FID has minted! Register to tracking system
      registerMintedFID(fid);
      
      // Get token URI
      const uriResponse = await fetch(BASE_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 2,
          method: 'eth_call',
          params: [
            {
              to: CONTRACT_ADDRESS,
              data: `0x${encodeFunctionCall('tokenURI', [Number(tokenId)])}`,
            },
            'latest'
          ]
        })
      });

      const uriData = await uriResponse.json() as { result?: string };
      const openseaUrl = `https://opensea.io/item/base/${CONTRACT_ADDRESS.toLowerCase()}/${tokenId}`;

      return NextResponse.json({
        hasMinted: true,
        tokenId: tokenId.toString(),
        openseaUrl: openseaUrl,
        tokenURI: uriData.result ? decodeString(uriData.result) : '',
      });
    }

    return NextResponse.json({ hasMinted: false });

  } catch (error) {
    console.error('Check mint status error:', error);
    // On error, assume not minted to allow user to try
    return NextResponse.json({ hasMinted: false });
  }
}

// Helper function to encode function call
function encodeFunctionCall(functionName: string, params: (string | number)[]): string {
  if (functionName === 'fidToTokenId') {
    // keccak256("fidToTokenId(uint256)") = 0x9a8a0592...
    const functionSelector = '9a8a0592';
    const fidParam = params[0] as number;
    const encodedParam = fidParam.toString(16).padStart(64, '0');
    return functionSelector + encodedParam;
  } else if (functionName === 'tokenURI') {
    // keccak256("tokenURI(uint256)") = 0xc87b56dd...
    const functionSelector = 'c87b56dd';
    const tokenIdParam = params[0] as number;
    const encodedParam = tokenIdParam.toString(16).padStart(64, '0');
    return functionSelector + encodedParam;
  }
  return '';
}

// Helper function to decode string from hex
function decodeString(hexString: string): string {
  try {
    // Remove '0x' prefix
    const hex = hexString.startsWith('0x') ? hexString.slice(2) : hexString;
    
    // Parse offset and length
    const offset = parseInt(hex.slice(0, 64), 16) * 2;
    const length = parseInt(hex.slice(offset, offset + 64), 16) * 2;
    const dataStart = offset + 64;
    
    // Extract string data
    const stringHex = hex.slice(dataStart, dataStart + length);
    
    // Convert hex to string
    let result = '';
    for (let i = 0; i < stringHex.length; i += 2) {
      const byte = parseInt(stringHex.substr(i, 2), 16);
      if (byte !== 0) {
        result += String.fromCharCode(byte);
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error decoding string:', error);
    return '';
  }
}
