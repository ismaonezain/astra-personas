'use client';

import { useEffect } from 'react';
import { useConnect, useAccount } from 'wagmi';
import sdk from '@farcaster/miniapp-sdk';

export function useAutoConnectWallet(): void {
  const { connect, connectors } = useConnect();
  const { isConnected } = useAccount();

  useEffect(() => {
    async function autoConnect(): Promise<void> {
      // Skip if already connected
      if (isConnected) return;

      try {
        // Check if we're in Farcaster context
        const context = await sdk.context;
        
        if (context && context.user) {
          // We're in Farcaster - use Farcaster connector
          const farcasterConnector = connectors.find(
            (c) => c.id === 'farcaster'
          );
          
          if (farcasterConnector) {
            connect({ connector: farcasterConnector });
            return;
          }
        }

        // Not in Farcaster context - try injected wallet (MetaMask, etc.)
        const injectedConnector = connectors.find(
          (c) => c.id === 'injected' || c.type === 'injected'
        );
        
        if (injectedConnector) {
          // Don't auto-connect injected - let user click button
          // This prevents unwanted MetaMask popups
          console.log('Injected wallet available - waiting for user action');
        }
      } catch (err) {
        console.error('Auto-connect error:', err);
      }
    }

    autoConnect();
  }, [isConnected, connect, connectors]);
}
