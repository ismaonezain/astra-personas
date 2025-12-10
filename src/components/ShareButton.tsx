'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import type { AstralVice } from '@/types';

interface ShareButtonProps {
  vice: AstralVice;
  fid: number;
}

export function ShareButton({ vice, fid }: ShareButtonProps) {
  const [isSharing, setIsSharing] = useState<boolean>(false);

  const handleShare = async (): Promise<void> => {
    try {
      setIsSharing(true);

      const shareText = `Just minted my ${vice.name} Astra Persona! ✨

🌙 Aura: ${vice.element}
⚡ Soul Trait: ${vice.power}
🎨 My unique cosmic archetype on Base

Mint yours now! 👇`;

      const shareUrl = `https://warpcast.com/~/compose?text=${encodeURIComponent(shareText)}&embeds[]=https://flies-tall-019.app.ohara.ai`;
      
      // Open in new window/tab
      window.open(shareUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <Button
      onClick={handleShare}
      disabled={isSharing}
      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-4 sm:px-6 rounded-lg transition-all transform hover:scale-105 active:scale-95"
      style={{
        boxShadow: '0 0 20px rgba(168, 85, 247, 0.4)'
      }}
    >
      {isSharing ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          <span>Opening...</span>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <svg 
            className="w-5 h-5" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" 
            />
          </svg>
          <span>Share on Farcaster</span>
        </div>
      )}
    </Button>
  );
}
