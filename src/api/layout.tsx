import type { Metadata } from 'next'
import '@coinbase/onchainkit/styles.css';
import './globals.css';
import { Providers } from './providers';
import FarcasterWrapper from "@/components/FarcasterWrapper";
src>app>layout.tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
        <html lang="en">
          <body>
            <Providers>
              
      <FarcasterWrapper>
        {children}
      </FarcasterWrapper>
      
            </Providers>
          </body>
        </html>
      );
}

export const metadata: Metadata = {
        title: "Astra Personas",
        description: "Unveil your unique spiritual archetype from the astral plane. Channel cosmic energy to mint your celestial persona NFT. Free minting on Base blockchain.",
        other: { "fc:frame": JSON.stringify({"version":"next","imageUrl":"https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/thumbnail_cmhaggfn2000004l435gd2yge-XAIoQbHTwTqaTwWxrOFW2u1Keggwqy","button":{"title":"Mint Now ✨","action":{"type":"launch_frame","name":"Astra Personas","url":"https://flies-tall-019.app.ohara.ai","splashImageUrl":"https://usdozf7pplhxfvrl.public.blob.vercel-storage.com/farcaster/splash_images/splash_image1.svg","splashBackgroundColor":"#ffffff"}}}
        ) }
    };
