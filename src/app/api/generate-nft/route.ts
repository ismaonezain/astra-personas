import { NextRequest, NextResponse } from 'next/server';
import type { AstralVice, NFTMetadata } from '@/types';
import { uploadImageToIPFS, uploadJSONToIPFS, ipfsToHttp } from '@/lib/pinata';

// Psychology-Based Attributes for Personas
const AURAS = [
  'Crimson', 'Shadow', 'Golden', 'Azure', 'Emerald', 'Violet', 'Radiant',
  'Obsidian', 'Ethereal', 'Infernal', 'Celestial', 'Frost'
];

const SOUL_TRAITS = [
  'Wisdom', 'Courage', 'Mystery', 'Passion', 'Serenity', 'Ambition',
  'Chaos', 'Harmony', 'Resilience', 'Cunning', 'Grace', 'Power'
];

const ARCHETYPES = [
  { name: 'Guardian', color: '#3B82F6', traits: 'protective and steadfast' },
  { name: 'Rebel', color: '#EF4444', traits: 'fierce and independent' },
  { name: 'Sage', color: '#8B5CF6', traits: 'wise and contemplative' },
  { name: 'Explorer', color: '#10B981', traits: 'curious and adventurous' },
  { name: 'Creator', color: '#F59E0B', traits: 'imaginative and innovative' },
  { name: 'Ruler', color: '#9333EA', traits: 'commanding and authoritative' },
  { name: 'Jester', color: '#EC4899', traits: 'playful and unpredictable' },
];

// Generate deterministic but unique characteristics based on FID
function generateCharacteristics(fid: number): { archetype: typeof ARCHETYPES[0], aura: string, soulTrait: string } {
  // Use FID as seed for deterministic generation
  const archetypeIndex = fid % ARCHETYPES.length;
  const auraIndex = Math.floor((fid * 7) % AURAS.length);
  const traitIndex = Math.floor((fid * 13) % SOUL_TRAITS.length);

  return {
    archetype: ARCHETYPES[archetypeIndex],
    aura: AURAS[auraIndex],
    soulTrait: SOUL_TRAITS[traitIndex],
  };
}

// Hair colors based on aura
const HAIR_COLORS: Record<string, string> = {
  'Shadow': 'midnight black with silver streaks',
  'Crimson': 'deep red with burgundy highlights',
  'Emerald': 'emerald green with jade highlights',
  'Azure': 'electric blue with sapphire tips',
  'Golden': 'brilliant gold with honey highlights',
  'Violet': 'deep purple with lavender streaks',
  'Obsidian': 'pitch black with dark purple undertones',
  'Ethereal': 'platinum white with iridescent shimmer',
  'Infernal': 'fiery orange-red with ember glow',
  'Celestial': 'silver-white with starlight sparkle',
  'Frost': 'icy white with crystalline blue shimmer',
  'Radiant': 'luminous blonde with golden aura'
};

// Clothing styles based on archetype
const CLOTHING_STYLES: Record<string, string> = {
  'Guardian': 'noble armor with protective plates and sacred symbols',
  'Rebel': 'edgy dark attire with chains and bold accessories',
  'Sage': 'flowing mystical robes with ancient runes and scrolls',
  'Explorer': 'adventurous gear with maps and compass details',
  'Creator': 'artistic robes adorned with brushes and creative tools',
  'Ruler': 'regal attire with crown and royal embellishments',
  'Jester': 'colorful theatrical outfit with playful patterns'
};

// Eye styles based on soul trait
const EYE_STYLES: Record<string, string> = {
  'Wisdom': 'deep knowing eyes with ancient light',
  'Courage': 'fierce determined eyes with fiery glow',
  'Mystery': 'enigmatic eyes with swirling shadows',
  'Passion': 'intense burning eyes with crimson flames',
  'Serenity': 'calm peaceful eyes with gentle aura',
  'Ambition': 'sharp focused eyes with golden gleam',
  'Chaos': 'wild unpredictable eyes with chaotic energy',
  'Harmony': 'balanced eyes with dual-colored harmony',
  'Resilience': 'steady unwavering eyes with inner strength',
  'Cunning': 'clever calculating eyes with sly shimmer',
  'Grace': 'elegant refined eyes with ethereal beauty',
  'Power': 'commanding eyes with overwhelming presence'
};

// Generate NFT image prompt based on FID and profile
async function generateNFTImage(fid: number, pfpUrl?: string): Promise<{ imageUrl: string; ipfsUrl: string }> {
  const { archetype, aura, soulTrait } = generateCharacteristics(fid);
  
  // Get unique visual characteristics
  const hairColor = HAIR_COLORS[aura] || 'mystical with supernatural glow';
  const clothingStyle = CLOTHING_STYLES[archetype.name] || 'mystical persona attire';
  const eyeStyle = EYE_STYLES[soulTrait] || 'glowing supernatural eyes';
  
  // Additional unique features based on FID
  const hasHalo = fid % 3 === 0;
  const hasWings = fid % 5 === 0;
  const hasCrown = fid % 7 === 0;
  const accessory = hasHalo ? 'mystical halo' : hasWings ? 'ethereal wings' : hasCrown ? 'ancient crown' : 'spiritual aura';
  
  // Create highly specific prompt for UNIQUE character generation
  const prompt = `Create a UNIQUE supernatural mystical ANIME character in Japanese manga/anime illustration style with these EXACT specifications:

ART STYLE (CRITICAL):
- HIGH-QUALITY ANIME/MANGA ILLUSTRATION STYLE - sharp, clean anime art
- Japanese anime aesthetic with cel-shading and vibrant colors
- Large expressive anime eyes with detailed highlights and reflections
- Stylized anime hair with dynamic flow and sharp strands
- Clean linework typical of professional anime character design
- Detailed anime facial features with smooth shading
- Semi-realistic anime proportions (NOT chibi, NOT western cartoon)

CHARACTER DESIGN - ${archetype.name} Archetype:
- Hair: ${hairColor}, styled in dramatic anime hairstyle
- Eyes: Large expressive anime eyes with ${eyeStyle}
- Clothing: ${clothingStyle}, with detailed anime rendering
- Special Feature: ${accessory} with dramatic anime styling
- Facial Expression: ${archetype.traits} anime character expression with ${soulTrait} aura
- Build: Detailed anime character with elegant proportions

COLOR PALETTE:
- Primary: ${archetype.color} with rich anime-style gradients and cel-shading
- Accents: Glowing ${aura} energy effects with anime glow style
- Background: Deep mystical gradient with ethereal anime particles and light effects
- High contrast shadows typical of anime illustration

COMPOSITION:
- Centered dynamic portrait, slight 3/4 angle typical of anime character art
- Dramatic anime lighting with rim lights and glow effects
- Mystical aura and energy particles surrounding character
- Mystical persona atmosphere with supernatural anime elements

IMPORTANT: Create a completely ORIGINAL anime character in Japanese manga/anime art style representing the ${archetype.name} archetype with ${soulTrait} soul trait. This must look like a professional anime character illustration. Focus on making it distinctly ANIME with large eyes, stylized hair, and clean anime linework.`;

  try {
    // Generate the image using the image generation API
    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, fid, pfpUrl }),
    });

    if (!response.ok) {
      throw new Error('Image generation failed');
    }

    const data = await response.json() as { imageUrl: string };
    const imageUrl = data.imageUrl;

    // Upload to IPFS via Pinata
    try {
      const ipfsUri = await uploadImageToIPFS(imageUrl, `persona-${fid}.png`);
      return {
        imageUrl: ipfsToHttp(ipfsUri),
        ipfsUrl: ipfsUri,
      };
    } catch (ipfsError) {
      console.error('IPFS upload failed, using direct URL:', ipfsError);
      return {
        imageUrl: imageUrl,
        ipfsUrl: imageUrl,
      };
    }
  } catch (error) {
    console.error('Image generation error:', error);
    // Fallback to deterministic avatar generator
    const { archetype, aura } = generateCharacteristics(fid);
    const bgColor = archetype.color.replace('#', '');
    const fallbackUrl = `https://api.dicebear.com/7.x/personas/svg?seed=${fid}-${aura}&backgroundColor=${bgColor}&size=512`;
    return {
      imageUrl: fallbackUrl,
      ipfsUrl: fallbackUrl,
    };
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as { fid: number; pfpUrl?: string };
    const { fid, pfpUrl } = body;

    if (fid === undefined || fid === null) {
      return NextResponse.json({ error: 'FID is required' }, { status: 400 });
    }

    // Generate unique characteristics
    const { archetype, aura, soulTrait } = generateCharacteristics(fid);

    // Generate unique image and upload to IPFS
    const { imageUrl, ipfsUrl } = await generateNFTImage(fid, pfpUrl);

    // Create unique persona name
    const uniqueName = `${aura} ${archetype.name}`;

    // Create Persona NFT
    const personaNFT: AstralVice = {
      id: `persona-${fid}`,
      name: uniqueName,
      description: `A cosmic ${archetype.name} channeling ${aura} energy from the astral plane, blessed with the gift of ${soulTrait}. ${archetype.traits.charAt(0).toUpperCase() + archetype.traits.slice(1)}, this celestial archetype embodies your unique spiritual essence across the metaverse.`,
      color: archetype.color,
      element: aura,
      power: soulTrait,
      imageUrl: imageUrl,
    };

    // Create OpenSea-compatible metadata
    const metadata: NFTMetadata = {
      name: uniqueName,
      description: personaNFT.description,
      image: ipfsUrl, // Use IPFS URL for metadata
      external_url: `https://personas.app/nft/${fid}`,
      attributes: [
        { trait_type: 'Archetype', value: archetype.name },
        { trait_type: 'Aura', value: aura },
        { trait_type: 'Soul Trait', value: soulTrait },
        { trait_type: 'FID', value: fid },
        { trait_type: 'Rarity', value: fid === 0 ? 'Limited Edition' : 'Unique' },
      ],
    };

    // Upload metadata to IPFS
    let metadataUri = '';
    try {
      metadataUri = await uploadJSONToIPFS(metadata);
    } catch (ipfsError) {
      console.error('Metadata IPFS upload failed:', ipfsError);
      // Continue without IPFS metadata
    }

    return NextResponse.json({
      nft: personaNFT,
      metadata: metadata,
      metadataUri: metadataUri || '',
      ipfsImageUrl: ipfsUrl,
    });
  } catch (error) {
    console.error('NFT generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate NFT' },
      { status: 500 }
    );
  }
}
