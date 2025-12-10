import { NextRequest, NextResponse } from 'next/server';

// Helper endpoint to provide instructions for setting contract URI
export async function GET(): Promise<NextResponse> {
  const contractAddress = '0x73eEdD8a06a84aA28cF6A871556BeF70935E2D86';
  
  return NextResponse.json({
    contractAddress,
    instructions: [
      '1. Upload collection metadata to IPFS by calling POST /api/collection-metadata',
      '2. Get the IPFS URI (e.g., ipfs://QmXXXXX...)',
      '3. Call setContractURI(ipfsUri) on the contract using Remix or your wallet',
      '4. Wait for transaction confirmation',
      '5. Your collection will appear on OpenSea with proper metadata!',
    ],
    remix_url: `https://remix.ethereum.org/#url=https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v5.0.0/contracts/token/ERC721/ERC721.sol&call=setContractURI&address=${contractAddress}`,
    opensea_url: `https://opensea.io/assets/base/${contractAddress}`,
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as { ipfsUri: string };
    const { ipfsUri } = body;

    if (!ipfsUri) {
      return NextResponse.json({ error: 'IPFS URI is required' }, { status: 400 });
    }

    // Return transaction data for calling setContractURI
    const contractAddress = '0x73eEdD8a06a84aA28cF6A871556BeF70935E2D86';
    
    return NextResponse.json({
      success: true,
      contractAddress,
      method: 'setContractURI',
      parameters: [ipfsUri],
      message: 'Call this method on your contract with the owner wallet',
      nextSteps: [
        '1. Connect your owner wallet (the wallet that deployed the contract)',
        '2. Call setContractURI(ipfsUri) with the IPFS URI',
        '3. Confirm the transaction and pay gas fees',
        '4. Wait for confirmation',
        '5. Your collection metadata will be live on OpenSea!',
      ],
    });
  } catch (error) {
    console.error('Set contract URI error:', error);
    return NextResponse.json(
      { error: 'Failed to prepare contract URI transaction' },
      { status: 500 }
    );
  }
}
