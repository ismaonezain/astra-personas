'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = '0x73eEdD8a06a84aA28cF6A871556BeF70935E2D86';
const CONTRACT_ABI = [
  'function setContractURI(string memory newContractURI) public',
  'function contractURI() public view returns (string)',
  'function owner() public view returns (address)',
];

export default function AdminPage(): JSX.Element {
  const [status, setStatus] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [ipfsUri, setIpfsUri] = useState<string>('');
  const [currentContractUri, setCurrentContractUri] = useState<string>('');
  const { address } = useAccount();

  const uploadMetadata = async (): Promise<void> => {
    try {
      setStatus('Uploading collection metadata to IPFS...');
      setError('');

      const response = await fetch('/api/collection-metadata', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to upload metadata');
      }

      const data = await response.json() as { ipfsUri: string; metadata: Record<string, unknown> };
      setIpfsUri(data.ipfsUri);
      setStatus(`✅ Metadata uploaded to IPFS: ${data.ipfsUri}`);
    } catch (err) {
      console.error('Upload error:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload metadata');
      setStatus('');
    }
  };

  const setContractURI = async (): Promise<void> => {
    if (!ipfsUri) {
      setError('Please upload metadata first');
      return;
    }

    if (!address) {
      setError('Please connect your wallet');
      return;
    }

    try {
      setStatus('Setting contract URI on-chain...');
      setError('');

      // Get provider from window.ethereum
      const provider = new ethers.BrowserProvider(window.ethereum as any);
      const signer = await provider.getSigner();

      // Create contract instance
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // Check if caller is owner
      const owner = await contract.owner();
      if (owner.toLowerCase() !== address.toLowerCase()) {
        throw new Error(`Only contract owner can set contract URI. Owner: ${owner}`);
      }

      // Set contract URI
      const tx = await contract.setContractURI(ipfsUri);
      setStatus('Transaction sent! Waiting for confirmation...');

      await tx.wait();
      setStatus('✅ Contract URI set successfully!');
      
      // Refresh current URI
      await getCurrentContractURI();
    } catch (err) {
      console.error('Set contract URI error:', err);
      setError(err instanceof Error ? err.message : 'Failed to set contract URI');
      setStatus('');
    }
  };

  const getCurrentContractURI = async (): Promise<void> => {
    try {
      const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);
      
      const uri = await contract.contractURI();
      setCurrentContractUri(uri);
    } catch (err) {
      console.error('Get contract URI error:', err);
      setCurrentContractUri('Not set yet');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-black/40 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-white">
              🎨 Astra Personas Admin
            </CardTitle>
            <CardDescription className="text-gray-300">
              Manage collection metadata for OpenSea
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="bg-black/40 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-xl text-white">Current Contract URI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={getCurrentContractURI} className="w-full">
              Check Current Contract URI
            </Button>
            {currentContractUri && (
              <div className="p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg">
                <p className="text-sm text-gray-300 break-all">
                  {currentContractUri}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-xl text-white">Step 1: Upload Metadata</CardTitle>
            <CardDescription className="text-gray-300">
              Upload collection metadata to IPFS
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={uploadMetadata}
              disabled={!!ipfsUri}
              className="w-full"
            >
              {ipfsUri ? '✅ Metadata Uploaded' : 'Upload Collection Metadata'}
            </Button>
            
            {ipfsUri && (
              <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-lg">
                <p className="text-xs text-gray-400 mb-1">IPFS URI:</p>
                <p className="text-sm text-green-400 break-all font-mono">
                  {ipfsUri}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-black/40 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-xl text-white">Step 2: Set Contract URI</CardTitle>
            <CardDescription className="text-gray-300">
              Update the contract with the IPFS URI (owner only)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={setContractURI}
              disabled={!ipfsUri || !address}
              className="w-full"
            >
              Set Contract URI On-Chain
            </Button>
            
            {!address && (
              <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg">
                <p className="text-sm text-yellow-400">
                  ⚠️ Please connect your wallet first
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {status && (
          <Card className="bg-green-900/20 border-green-500/30">
            <CardContent className="pt-6">
              <p className="text-sm text-green-400">{status}</p>
            </CardContent>
          </Card>
        )}

        {error && (
          <Card className="bg-red-900/20 border-red-500/30">
            <CardContent className="pt-6">
              <p className="text-sm text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card className="bg-black/40 border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-lg text-white">📚 What is Contract URI?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-gray-300">
            <p>
              <strong>Contract URI</strong> is metadata for your entire collection on OpenSea.
            </p>
            <p>
              Without it, your collection won't have a name, description, or banner on OpenSea.
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li><strong>Token URI</strong>: Metadata for each individual NFT ✅</li>
              <li><strong>Contract URI</strong>: Metadata for the collection ⚠️ (needs to be set)</li>
            </ul>
            <p className="pt-2">
              Contract address: <code className="text-purple-400">{CONTRACT_ADDRESS}</code>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
