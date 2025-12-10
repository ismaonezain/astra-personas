'use client'

import { useState } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Upload, Settings, CheckCircle, XCircle } from 'lucide-react'

const CONTRACT_ADDRESS = '0x73eEdD8a06a84aA28cF6A871556BeF70935E2D86' as `0x${string}`

const CONTRACT_ABI = [
  {
    inputs: [{ internalType: 'string', name: '_contractURI', type: 'string' }],
    name: 'setContractURI',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'contractURI',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

interface AdminModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AdminModal({ open, onOpenChange }: AdminModalProps) {
  const { address } = useAccount()
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [ipfsHash, setIpfsHash] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string>('')

  const { data: hash, writeContract, isPending: isWriting } = useWriteContract()
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({ hash })

  const handleUploadMetadata = async (): Promise<void> => {
    setUploadStatus('uploading')
    setErrorMessage('')

    try {
      const response = await fetch('/api/collection-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Astra Personas',
          description: 'A mystical collection of 3,000 unique personas on Base blockchain. Each persona represents a unique identity tied to your Farcaster ID.',
          image: 'ipfs://QmYourBannerImageHash',
          external_link: 'https://astra-personas.vercel.app',
          seller_fee_basis_points: 500,
          fee_recipient: address,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to upload metadata')
      }

      const data = await response.json()
      setIpfsHash(data.ipfsHash)
      setUploadStatus('success')
    } catch (error) {
      console.error('Upload error:', error)
      setUploadStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to upload metadata')
    }
  }

  const handleSetContractURI = (): void => {
    if (!ipfsHash) {
      setErrorMessage('Please upload metadata first')
      return
    }

    writeContract({
      address: CONTRACT_ADDRESS,
      abi: CONTRACT_ABI,
      functionName: 'setContractURI',
      args: [`ipfs://${ipfsHash}`],
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Admin Dashboard
          </DialogTitle>
          <DialogDescription>
            Manage collection metadata and contract settings (Owner only)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-2">
          {/* Step 1: Upload Metadata */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Step 1: Upload Metadata</CardTitle>
              <CardDescription className="text-xs">
                Upload to IPFS for OpenSea
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="bg-gray-50 p-3 rounded-lg space-y-1 text-xs">
                <p><strong>Name:</strong> Astra Personas</p>
                <p><strong>Supply:</strong> 3,000 | <strong>Royalty:</strong> 5%</p>
              </div>

              <Button
                onClick={handleUploadMetadata}
                disabled={uploadStatus === 'uploading' || uploadStatus === 'success'}
                className="w-full text-sm py-2"
                size="sm"
              >
                {uploadStatus === 'uploading' && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                {uploadStatus === 'success' && <CheckCircle className="mr-1.5 h-3.5 w-3.5" />}
                {uploadStatus === 'error' && <XCircle className="mr-1.5 h-3.5 w-3.5" />}
                {uploadStatus === 'idle' && <Upload className="mr-1.5 h-3.5 w-3.5" />}
                {uploadStatus === 'idle' && 'Upload to IPFS'}
                {uploadStatus === 'uploading' && 'Uploading...'}
                {uploadStatus === 'success' && 'Uploaded ✓'}
                {uploadStatus === 'error' && 'Retry'}
              </Button>

              {ipfsHash && (
                <div className="bg-green-50 border border-green-200 p-2 rounded-lg">
                  <p className="text-xs font-medium text-green-800">IPFS: {ipfsHash.slice(0, 12)}...</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Step 2: Set Contract URI */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Step 2: Set On-Chain</CardTitle>
              <CardDescription className="text-xs">
                Write IPFS hash to contract
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={handleSetContractURI}
                disabled={!ipfsHash || isWriting || isConfirming || isConfirmed}
                className="w-full text-sm py-2"
                size="sm"
              >
                {(isWriting || isConfirming) && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                {isConfirmed && <CheckCircle className="mr-1.5 h-3.5 w-3.5" />}
                {!ipfsHash && 'Upload First'}
                {ipfsHash && !isWriting && !isConfirming && !isConfirmed && 'Set Contract URI'}
                {isWriting && 'Confirming...'}
                {isConfirming && 'Waiting...'}
                {isConfirmed && 'Success ✓'}
              </Button>

              {hash && (
                <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg">
                  <p className="text-xs font-medium text-blue-800">Tx: {hash.slice(0, 10)}...{hash.slice(-8)}</p>
                </div>
              )}

              {isConfirmed && (
                <div className="bg-green-50 border border-green-200 p-2 rounded-lg">
                  <p className="text-xs font-medium text-green-800">✅ Metadata set! Check OpenSea in a few minutes.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 p-2 rounded-lg">
              <p className="text-xs font-medium text-red-800">❌ {errorMessage}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
