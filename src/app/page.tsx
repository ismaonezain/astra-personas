'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import type { AstralVice, NFTMetadata } from '@/types';
import { ViceCard } from '@/components/ViceCard';
import { MintButton } from '@/components/MintButton';
import { ShareButton } from '@/components/ShareButton';
import { WalletConnectButton } from '@/components/game/WalletConnectButton';
import { UserProfile } from '@/components/UserProfile';
import { AdminModal } from '@/components/AdminModal';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { useFarcasterProfile } from '@/hooks/useFarcasterProfile';
import { useAutoConnectWallet } from '@/hooks/useAutoConnectWallet';
import { sdk } from "@farcaster/miniapp-sdk";
import { useAddMiniApp } from "@/hooks/useAddMiniApp";

const CONTRACT_ADDRESS = '0x73eEdD8a06a84aA28cF6A871556BeF70935E2D86' as `0x${string}`;

const CONTRACT_ABI = [
  {
    inputs: [],
    name: 'owner',
    outputs: [{ internalType: 'address', name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

export default function Home(): JSX.Element {
    const { addMiniApp } = useAddMiniApp();
    useEffect(() => {
      const tryAddMiniApp = async () => {
        try {
          await addMiniApp()
        } catch (error) {
          console.error('Failed to add mini app:', error)
        }

      }

    

      tryAddMiniApp()
    }, [addMiniApp])
    useEffect(() => {
      const initializeFarcaster = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 100));
          if (document.readyState !== 'complete') {
            await new Promise(resolve => {
              if (document.readyState === 'complete') {
                resolve(void 0);
              } else {
                window.addEventListener('load', () => resolve(void 0), { once: true });
              }

            });
          }

          await sdk.actions.ready();
          console.log("Farcaster SDK initialized successfully - app fully loaded");
        } catch (error) {
          console.error('Failed to initialize Farcaster SDK:', error);
          setTimeout(async () => {
            try {
              await sdk.actions.ready();
              console.log('Farcaster SDK initialized on retry');
            } catch (retryError) {
              console.error('Farcaster SDK retry failed:', retryError);
            }

          }, 1000);
        }

      };
      initializeFarcaster();
    }, []);
  const { address, isConnected } = useAccount();
  const { profile, isLoading: profileLoading } = useFarcasterProfile();
  
  // Auto-connect wallet when in Farcaster context
  useAutoConnectWallet();
  
  const [vice, setVice] = useState<AstralVice | null>(null);
  const [metadata, setMetadata] = useState<NFTMetadata | null>(null);
  const [metadataUri, setMetadataUri] = useState<string>('');
  const [generating, setGenerating] = useState<boolean>(false);
  const [hasMinted, setHasMinted] = useState<boolean>(false);
  const [mintedData, setMintedData] = useState<{ tokenId: string; openseaUrl: string } | null>(null);
  const [error, setError] = useState<string>('');
  const [totalMinted, setTotalMinted] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [adminModalOpen, setAdminModalOpen] = useState<boolean>(false);

  // Check if current user is contract owner
  const { data: contractOwner } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: CONTRACT_ABI,
    functionName: 'owner',
  });

  const isOwner = address && contractOwner && address.toLowerCase() === contractOwner.toLowerCase();

  // Fetch total minted count
  useEffect(() => {
    const fetchTotalMinted = async (): Promise<void> => {
      try {
        const response = await fetch('/api/contract-stats');
        if (response.ok) {
          const data = await response.json() as { totalSupply: number };
          setTotalMinted(data.totalSupply);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTotalMinted();
  }, [hasMinted]);

  // Check if FID has already minted on component mount
  useEffect(() => {
    const checkMintStatus = async (): Promise<void> => {
      if (!profile?.fid) return;
      
      try {
        console.log('Checking mint status for FID:', profile.fid);
        const response = await fetch('/api/check-mint-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fid: profile.fid }),
        });

        if (response.ok) {
          const data = await response.json() as { 
            hasMinted: boolean; 
            tokenId?: string; 
            openseaUrl?: string;
          };
          
          if (data.hasMinted && data.tokenId && data.openseaUrl) {
            console.log('FID has already minted! Token ID:', data.tokenId);
            
            // IMMEDIATELY set hasMinted state - don't wait for NFT data
            setHasMinted(true);
            setMintedData({ 
              tokenId: data.tokenId, 
              openseaUrl: data.openseaUrl 
            });
            
            // Generate NFT data to display (deterministic based on FID) - optional
            try {
              const nftResponse = await fetch('/api/generate-nft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                  fid: profile.fid,
                  pfpUrl: profile.pfpUrl 
                }),
              });

              if (nftResponse.ok) {
                const nftData = await nftResponse.json() as { 
                  nft: AstralVice; 
                  metadata: NFTMetadata;
                };
                
                setVice(nftData.nft);
                setMetadata(nftData.metadata);
              }
            } catch (err) {
              console.error('Failed to load NFT preview, but FID is already minted:', err);
              // Silently fail - user already minted, no need to block UI
            }
          }
        }
      } catch (err) {
        console.error('Failed to check mint status:', err);
        // Don't block user if check fails
      }
    };

    checkMintStatus();
  }, [profile]);

  const handleGenerateNFT = async (): Promise<void> => {
    if (!profile) return;
    
    setGenerating(true);
    setError('');

    try {
      console.log('Generating NFT for FID:', profile.fid);
      const nftResponse = await fetch('/api/generate-nft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fid: profile.fid,
          pfpUrl: profile.pfpUrl 
        }),
      });

      if (nftResponse.ok) {
        const nftData = await nftResponse.json() as { 
          nft: AstralVice; 
          metadata: NFTMetadata;
          metadataUri: string;
        };
        console.log('NFT generated:', nftData);
        setVice(nftData.nft);
        setMetadata(nftData.metadata);
        setMetadataUri(nftData.metadataUri || '');
      } else {
        console.error('NFT generation failed');
        setError('Failed to generate NFT. Please try again.');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError('Failed to generate NFT. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <main 
      className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-indigo-900 px-4 py-6 md:px-8 md:py-8"
    >
      <div className="max-w-2xl mx-auto space-y-6 md:space-y-8 pt-12 md:pt-8 pb-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500">
            Astra Personas
          </h1>
          <p className="text-gray-300 text-base md:text-lg px-2">
            Discover Your Cosmic Identity
          </p>
        </div>

        {/* Wallet Connection */}
        <div className="flex justify-center gap-3">
          <WalletConnectButton />
          
          {/* Admin Button - Only visible to contract owner */}
          {isOwner && (
            <Button
              onClick={() => setAdminModalOpen(true)}
              variant="outline"
              className="bg-yellow-500/10 border-yellow-500/50 text-yellow-400 hover:bg-yellow-500/20 hover:text-yellow-300"
            >
              <Settings className="w-4 h-4 mr-2" />
              Admin
            </Button>
          )}
        </div>

        {/* Admin Modal */}
        <AdminModal 
          open={adminModalOpen} 
          onOpenChange={setAdminModalOpen}
        />

        {/* Collection Info */}
        <Card className="bg-black/40 border-purple-500/30">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="text-center">
                <h2 className="text-xl font-bold text-white mb-2">
                  🌟 Limited Collection
                </h2>
                <p className="text-gray-300 text-sm mb-4">
                  A mystical collection of 3,000 unique persona NFTs on Base blockchain. 
                  Each Farcaster ID can mint one eternal cosmic archetype.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-purple-900/30 rounded-lg p-4">
                  <p className="text-gray-400 text-xs mb-1">Minted</p>
                  <p className="text-white text-2xl font-bold">
                    {loading ? '...' : totalMinted}
                  </p>
                </div>
                <div className="bg-purple-900/30 rounded-lg p-4">
                  <p className="text-gray-400 text-xs mb-1">Max Supply</p>
                  <p className="text-white text-2xl font-bold">3,000</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">⛓️ Chain</span>
                  <span className="text-white font-semibold">Base</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">👤 Limit</span>
                  <span className="text-white font-semibold">1 NFT per FID</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">💎 Royalty</span>
                  <span className="text-white font-semibold">5%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">⛽ Cost</span>
                  <span className="text-white font-semibold">Gas Only</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Profile - Show when connected and profile loaded */}
        {isConnected && !profileLoading && profile && (
          <UserProfile 
            user={{
              fid: profile.fid,
              username: profile.username,
              displayName: profile.displayName,
              pfpUrl: profile.pfpUrl || '',
            }}
            isConnected={isConnected}
          />
        )}

        {!vice && !generating && !hasMinted && (
          <div className="text-center space-y-6 py-8">
            <Card className="bg-purple-900/30 border-purple-500 max-w-md mx-auto">
              <CardContent className="p-8">
                <div className="space-y-4">
                  <div className="text-6xl">✨</div>
                  <h2 className="text-2xl font-bold text-white">
                    Unveil Your Archetype
                  </h2>
                  <p className="text-gray-300 text-sm">
                    Channel cosmic energy to reveal your unique spiritual archetype from the astral plane
                  </p>
                  <button
                    onClick={handleGenerateNFT}
                    disabled={!isConnected || profileLoading}
                    className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 hover:from-purple-700 hover:via-pink-700 hover:to-red-700 text-white font-bold py-4 px-8 rounded-lg transition-all transform hover:scale-105 active:scale-95 shadow-lg text-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    🎨 Generate NFT
                  </button>
                  {!isConnected && (
                    <p className="text-xs text-yellow-400">
                      Please connect your wallet to generate
                    </p>
                  )}
                  {profileLoading && (
                    <p className="text-xs text-gray-400">
                      Loading profile...
                    </p>
                  )}
                  <p className="text-xs text-gray-500">
                    Your celestial identity awaits
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {generating && (
          <div className="text-center space-y-4 py-12">
            <div className="flex justify-center">
              <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <div className="text-white text-lg">
              Channeling cosmic energy...
            </div>
            <div className="text-gray-400 text-sm">
              The astral plane is revealing your archetype
            </div>
          </div>
        )}

        {error && vice === null && !generating && (
          <Card className="bg-red-900/30 border-red-500">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <div className="text-4xl">⚠️</div>
                <p className="text-white text-base">{error}</p>
                <button
                  onClick={handleGenerateNFT}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show NFT Card + Mint/Success State */}
        {(vice || hasMinted) && profile && (
          <>
            {vice && <ViceCard vice={vice} fid={profile.fid} />}

            {!hasMinted ? (
              <MintButton 
                  vice={vice}
                  metadata={metadata || undefined}
                  fid={profile.fid}
                  userAddress={address || ''}
                  metadataUri={metadataUri}
                  onMintSuccess={(tokenId: string, openseaUrl: string) => {
                    setHasMinted(true);
                    setMintedData({ tokenId, openseaUrl });
                  }}
                />
            ) : (
              <div className="space-y-4">
                <div className="text-center space-y-2 bg-green-900/20 border border-green-500 rounded-lg p-6">
                  <p className="text-green-400 text-2xl font-bold">
                    ✨ Successfully Minted! ✨
                  </p>
                  <p className="text-gray-300 text-sm">
                    Your Astra Persona has manifested on Base
                  </p>
                  {mintedData && (
                    <p className="text-gray-400 text-xs font-mono">
                      Token ID: {mintedData.tokenId}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {vice && <ShareButton vice={vice} fid={profile.fid} />}
                  
                  {mintedData?.openseaUrl && (
                    <a
                      href={mintedData.openseaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${vice ? 'w-full' : 'col-span-2'} bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2`}
                    >
                      <svg 
                        className="w-5 h-5" 
                        viewBox="0 0 24 24" 
                        fill="currentColor"
                      >
                        <path d="M12 0C5.374 0 0 5.374 0 12s5.374 12 12 12 12-5.374 12-12S18.626 0 12 0zm5.568 7.568l-5.568 5.568-5.568-5.568L7.568 6.432 12 10.864l4.432-4.432 1.136 1.136z"/>
                      </svg>
                      View on OpenSea
                    </a>
                  )}
                </div>
                </div>
            )}
          </>
        )}

        <div className="text-center space-y-2 pt-4">
          <p className="text-xs text-gray-500">
            Created by <a 
              href="https://warpcast.com/ismaone" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-purple-400 hover:text-purple-300 underline"
            >
              ismaone
            </a> (FID 235940)
          </p>
          <p className="text-xs text-gray-600">
            Minting on Base • Built with Ohara
          </p>
        </div>
      </div>
    </main>
  );
}
