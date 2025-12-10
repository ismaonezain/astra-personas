'use client';

import { useState, useEffect } from 'react';
import sdk from '@farcaster/miniapp-sdk';

export interface FarcasterProfile {
  fid: number;
  username: string;
  displayName: string;
  pfpUrl?: string;
  bio?: string;
  platform: string;
  verifiedAddresses: string[];
}

export function useFarcasterProfile(): {
  profile: FarcasterProfile | null;
  isLoading: boolean;
  error: string | null;
} {
  const [profile, setProfile] = useState<FarcasterProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile(): Promise<void> {
      try {
        setIsLoading(true);
        
        // Get context from Farcaster SDK
        const context = await sdk.context;
        
        if (!context || !context.user) {
          // Not in Farcaster context - set anonymous
          setProfile({
            fid: 0,
            username: 'anonymous',
            displayName: 'Anonymous User',
            platform: 'Unknown',
            verifiedAddresses: []
          });
          setIsLoading(false);
          return;
        }

        const { user, client } = context;
        
        // Detect platform based on clientFid
        let platform = 'Farcaster';
        if (client?.clientFid === 238626) {
          platform = 'Base App';
        }

        // Build profile from SDK context
        const farcasterProfile: FarcasterProfile = {
          fid: user.fid || 0,
          username: user.username || 'anonymous',
          displayName: user.displayName || user.username || 'Anonymous User',
          pfpUrl: user.pfpUrl,
          bio: user.bio,
          platform,
          verifiedAddresses: user.verifications || []
        };

        setProfile(farcasterProfile);
        setError(null);
      } catch (err) {
        console.error('Error fetching Farcaster profile:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch profile');
        
        // Fallback to anonymous
        setProfile({
          fid: 0,
          username: 'anonymous',
          displayName: 'Anonymous User',
          platform: 'Unknown',
          verifiedAddresses: []
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchProfile();
  }, []);

  return { profile, isLoading, error };
}
