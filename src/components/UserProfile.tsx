'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import type { FarcasterUser } from '@/types';

interface UserProfileProps {
  user: FarcasterUser;
  isConnected: boolean;
}

export function UserProfile({ user, isConnected }: UserProfileProps): JSX.Element {
  const displayAvatar = user.pfpUrl || `https://avatar.vercel.sh/${user.username}`;
  const initials = user.displayName
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase() || user.username.substring(0, 2).toUpperCase();

  return (
    <Card className="bg-purple-900/30 border-purple-500/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16 border-2 border-purple-400">
            <AvatarImage src={displayAvatar} alt={user.username} />
            <AvatarFallback className="bg-purple-700 text-white text-xl">
              {initials}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate">
              {user.displayName || user.username}
            </h3>
            <p className="text-sm text-purple-300 truncate">
              @{user.username}
            </p>
            {user.fid > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                FID: {user.fid}
              </p>
            )}
          </div>

          {isConnected && (
            <div className="flex-shrink-0">
              <div className="flex items-center gap-2 bg-green-900/30 border border-green-500 rounded-full px-3 py-1">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-400 font-semibold">Connected</span>
              </div>
            </div>
          )}
        </div>

        {user.fid === 0 && (
          <div className="mt-3 bg-yellow-900/30 border border-yellow-500 rounded-lg p-2">
            <p className="text-yellow-300 text-xs font-semibold text-center">
              ⭐ Limited Edition - Non-Farcaster User
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
