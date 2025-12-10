'use client';

import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function WalletConnectButton(): JSX.Element {
  const { address, isConnected, chain } = useAccount();
  const { connect, connectors, isPending, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();
  const [isClient, setIsClient] = useState(false);

  // Ensure this only renders on client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Auto-switch to Base network after connection
  useEffect(() => {
    if (isConnected && chain?.id !== base.id) {
      switchChain({ chainId: base.id });
    }
  }, [isConnected, chain, switchChain]);

  // Log connector status for debugging
  useEffect(() => {
    if (isClient) {
      console.log('Available connectors:', connectors.map(c => ({ id: c.id, name: c.name, type: c.type })));
    }
  }, [isClient, connectors]);

  const handleConnect = (): void => {
    console.log('Attempting to connect wallet...');
    console.log('Available connectors:', connectors);

    // Try connectors in order of preference:
    // 1. Farcaster (if in Farcaster context)
    // 2. Injected (MetaMask, Coinbase, Brave, etc.)
    // 3. WalletConnect (mobile wallets)
    
    const farcasterConnector = connectors.find((c) => c.id === 'farcaster');
    const injectedConnector = connectors.find(
      (c) => c.id === 'injected' || c.type === 'injected' || c.name.toLowerCase().includes('injected')
    );
    const walletConnectConnector = connectors.find((c) => c.id === 'walletConnect');

    // Try Farcaster first
    if (farcasterConnector) {
      console.log('Using Farcaster connector');
      connect({ connector: farcasterConnector });
      return;
    }

    // Then try injected wallet
    if (injectedConnector) {
      console.log('Using Injected connector (MetaMask, etc.)');
      connect({ connector: injectedConnector });
      return;
    }

    // Finally WalletConnect
    if (walletConnectConnector) {
      console.log('Using WalletConnect connector');
      connect({ connector: walletConnectConnector });
      return;
    }

    // If no connectors, try the first available one
    if (connectors.length > 0) {
      console.log('Using first available connector:', connectors[0]);
      connect({ connector: connectors[0] });
      return;
    }

    console.error('No connectors available');
  };

  const formatAddress = (addr: string): string => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Don't render until client-side
  if (!isClient) {
    return (
      <Button disabled className="bg-gradient-to-r from-purple-600 to-pink-600">
        Loading...
      </Button>
    );
  }

  // Show error if there is one
  if (error) {
    console.error('Connection error:', error);
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        {chain?.id !== base.id && (
          <Button
            onClick={() => switchChain({ chainId: base.id })}
            variant="outline"
            size="sm"
          >
            Switch to Base
          </Button>
        )}
        <div className="flex items-center gap-2 px-4 py-2 bg-purple-900/30 rounded-lg border border-purple-500/30">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-purple-100">
            {formatAddress(address)}
          </span>
        </div>
        <Button
          onClick={() => disconnect()}
          variant="outline"
          size="sm"
        >
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleConnect}
        disabled={isPending || connectors.length === 0}
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
      >
        {isPending ? 'Connecting...' : connectors.length === 0 ? 'No Wallet Found' : 'Connect Wallet'}
      </Button>
      {error && (
        <p className="text-xs text-red-400">
          Error: {error?.message || String(error) || 'Connection failed'}
        </p>
      )}
    </div>
  );
}
