'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { AstralVice, NFTMetadata } from '@/types';
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';

interface MintButtonProps {
  vice: AstralVice;
  metadata?: NFTMetadata;
  fid: number;
  userAddress: string;
  onMintSuccess: (tokenId: string, openseaUrl: string) => void;
  metadataUri?: string;
}

// Astra Personas Contract ABI - Full JSON ABI from verified Basescan contract
// Contract deployed at: 0x73eEdD8a06a84aA28cF6A871556BeF70935E2D86
const CONTRACT_ABI = [{
  inputs: [
    { internalType: 'address', name: 'to', type: 'address' },
    { internalType: 'uint256', name: 'fid', type: 'uint256' },
    { internalType: 'string', name: 'uri', type: 'string' }
  ],
  name: 'safeMint',
  outputs: [],
  stateMutability: 'nonpayable',
  type: 'function'
}] as const;

// ✅ CONTRACT DEPLOYED ON BASE MAINNET
const CONTRACT_ADDRESS = '0x73eEdD8a06a84aA28cF6A871556BeF70935E2D86' as `0x${string}`;

export function MintButton({ vice, metadata, fid, userAddress, onMintSuccess, metadataUri }: MintButtonProps) {
  const [mintStatus, setMintStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const { chain } = useAccount();
  const { switchChain } = useSwitchChain();
  
  const { writeContract, data: hash, error: writeError, isPending } = useWriteContract();
  const { isLoading: isConfirming, isSuccess, data: receipt } = useWaitForTransactionReceipt({
    hash,
  });

  const isMinting = isPending || isConfirming;

  // Handle transaction success
  useEffect(() => {
    if (isSuccess && hash && receipt) {
      console.log('✅ Transaction confirmed! Hash:', hash);
      console.log('Receipt:', receipt);
      
      // Parse Transfer event to get tokenId
      // Transfer event signature: Transfer(address indexed from, address indexed to, uint256 indexed tokenId)
      let tokenId = fid.toString(); // Fallback to FID if we can't parse
      
      try {
        // Look for Transfer event in logs
        const transferLog = receipt.logs.find((log: { topics: string[] }) => 
          log.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef' // Transfer event signature
        );
        
        if (transferLog && transferLog.topics && transferLog.topics[3]) {
          // Token ID is the 3rd indexed parameter (topics[3])
          tokenId = BigInt(transferLog.topics[3]).toString();
          console.log('✅ Parsed token ID from event:', tokenId);
        } else {
          console.log('⚠️ Could not parse token ID from logs, using FID as fallback');
        }
      } catch (err) {
        console.error('Error parsing token ID:', err);
        console.log('Using FID as fallback token ID');
      }
      
      // OpenSea URL with lowercase contract address and correct format
      const openseaUrl = `https://opensea.io/item/base/${CONTRACT_ADDRESS.toLowerCase()}/${tokenId}`;
      
      setMintStatus('✨ Success! Your Persona has been minted!');
      setTimeout(() => {
        onMintSuccess(tokenId, openseaUrl);
      }, 1000);
    }
  }, [isSuccess, hash, receipt, fid, onMintSuccess]);

  // Handle write errors
  useEffect(() => {
    if (writeError) {
      console.error('=== MINTING ERROR ===');
      console.error('Error:', writeError);
      
      let errorMessage = 'Minting failed. Please try again.';
      const errMsg = writeError.message || '';
      
      if (errMsg.includes('user rejected') || errMsg.includes('User rejected')) {
        errorMessage = 'Transaction was rejected by user.';
      } else if (errMsg.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas fees.';
      } else if (errMsg.includes('already minted')) {
        errorMessage = 'This FID has already minted a Persona NFT!';
      } else if (errMsg) {
        errorMessage = errMsg;
      }
      
      setError(errorMessage);
      setMintStatus('');
    }
  }, [writeError]);

  const handleMint = async (): Promise<void> => {
    if (!userAddress) {
      setError('Please connect your wallet first');
      return;
    }

    // Check if on Base network
    if (chain?.id !== base.id) {
      setMintStatus('Switching to Base network...');
      try {
        await switchChain({ chainId: base.id });
        setMintStatus('');
      } catch (err) {
        setError('Please switch to Base network manually');
        setMintStatus('');
        return;
      }
    }

    try {
      setError('');
      setMintStatus('Checking mint status...');

      // Check if FID has already minted
      const checkResponse = await fetch('/api/check-mint-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fid }),
      });

      if (checkResponse.ok) {
        const checkData = await checkResponse.json() as {
          hasMinted: boolean;
          tokenId?: string;
          openseaUrl?: string;
        };

        if (checkData.hasMinted && checkData.tokenId && checkData.openseaUrl) {
          // FID has already minted! Trigger success callback
          console.log('✅ FID has already minted! Token ID:', checkData.tokenId);
          setMintStatus('✨ This FID has already minted!');
          setTimeout(() => {
            onMintSuccess(checkData.tokenId!, checkData.openseaUrl!);
          }, 1000);
          return;
        }
      }

      setMintStatus('Preparing your Persona NFT...');

      console.log('=== MINT DEBUG INFO ===');
      console.log('Minting to:', userAddress);
      console.log('FID:', fid);
      console.log('Contract address:', CONTRACT_ADDRESS);

      // Use metadata URI or fallback
      const tokenURI = metadataUri || metadata?.image || `data:application/json,${encodeURIComponent(JSON.stringify(metadata))}`;
      console.log('Token URI length:', tokenURI.length);
      console.log('Token URI preview:', tokenURI.substring(0, 100));

      setMintStatus('Initiating mint transaction...');

      // Call safeMint with Wagmi
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: CONTRACT_ABI,
        functionName: 'safeMint',
        args: [userAddress as `0x${string}`, BigInt(fid), tokenURI],
      });

      setMintStatus('Transaction submitted! Waiting for confirmation...');

    } catch (err: unknown) {
      console.error('=== MINTING ERROR ===');
      console.error('Full error:', err);
      
      const error = err as { message?: string };
      setError(error.message || 'Minting failed. Please try again.');
      setMintStatus('');
    }
  };

  // Show waiting message if wallet not detected yet
  if (!userAddress) {
    return (
      <div className="space-y-4">
        <div className="text-center p-4 sm:p-6 bg-yellow-900/20 border border-yellow-500 rounded-lg">
          <p className="text-yellow-300 text-sm sm:text-base mb-3 sm:mb-4 font-semibold">
            ⏳ Please connect your wallet to continue
          </p>
          <p className="text-gray-400 text-xs sm:text-sm">
            Click the Connect Wallet button above
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Button 
        onClick={handleMint}
        disabled={isMinting}
        className="w-full text-base sm:text-lg py-5 sm:py-6 font-bold transition-all transform hover:scale-105 active:scale-95"
        style={{ 
          backgroundColor: isMinting ? '#666' : vice.color,
          color: 'white',
          boxShadow: `0 0 20px ${vice.color}60`
        }}
      >
        {isMinting ? (
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>{isConfirming ? 'Confirming...' : 'Preparing...'}</span>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <span>Mint Now ✨</span>
            <span className="text-sm font-normal opacity-90">FREE (gas only)</span>
          </div>
        )}
      </Button>
      
      {mintStatus && (
        <div className="text-center space-y-2 bg-purple-900/20 border border-purple-500/30 rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-gray-300 animate-pulse">
            {mintStatus}
          </p>
        </div>
      )}

      {hash && !isSuccess && (
        <div className="text-center space-y-2 bg-blue-900/20 border border-blue-500/30 rounded-lg p-3 sm:p-4">
          <p className="text-xs text-gray-400">Transaction Hash:</p>
          <a
            href={`https://basescan.org/tx/${hash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-400 hover:underline break-all font-mono"
          >
            {hash}
          </a>
        </div>
      )}
      
      {error && (
        <div className="text-center bg-red-900/20 border border-red-500/30 rounded-lg p-3 sm:p-4">
          <p className="text-xs sm:text-sm text-red-400">
            {error}
          </p>
        </div>
      )}

      <div className="text-center text-[10px] sm:text-xs text-gray-500 space-y-1 px-2">
        <p>Wallet: {userAddress.slice(0, 6)}...{userAddress.slice(-4)}</p>
        <p>Minting on Base • FREE (gas only)</p>
        <p className="text-purple-400">💎 5% royalty → creator</p>
        <p className="text-yellow-400">🔥 Limited to 3,000 Personas</p>
      </div>
    </div>
  );
}
