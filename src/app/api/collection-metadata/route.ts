import { NextResponse } from 'next/server';
import { uploadJSONToIPFS } from '@/lib/pinata';

// OpenSea Collection Metadata Standard
// https://docs.opensea.io/docs/contract-level-metadata
const collectionMetadata = {
  name: 'Astra Personas',
  description: 'A mystical collection of 3,000 unique cosmic personas representing your spiritual essence across the metaverse. Each Persona is tied to a unique Farcaster ID and channels distinct archetypal energies from the astral plane.',
  image: 'https://api.dicebear.com/7.x/personas/svg?seed=astra-collection&backgroundColor=6366f1&size=512',
  external_link: 'https://personas.app',
  seller_fee_basis_points: 500, // 5% royalty
  fee_recipient: '0x4e3636884008f3FafC845431c3f320F6430265F7',
};

export async function GET(): Promise<NextResponse> {
  try {
    // Return the collection metadata
    return NextResponse.json(collectionMetadata);
  } catch (error) {
    console.error('Collection metadata error:', error);
    return NextResponse.json(
      { error: 'Failed to get collection metadata' },
      { status: 500 }
    );
  }
}

// Upload to IPFS endpoint
export async function POST(): Promise<NextResponse> {
  try {
    // Upload collection metadata to IPFS
    const ipfsUri = await uploadJSONToIPFS(collectionMetadata);
    
    return NextResponse.json({
      success: true,
      ipfsUri,
      metadata: collectionMetadata,
      message: 'Collection metadata uploaded to IPFS successfully',
    });
  } catch (error) {
    console.error('IPFS upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload to IPFS' },
      { status: 500 }
    );
  }
}
