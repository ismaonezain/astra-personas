'use client';

import type { AstralVice } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ViceCardProps {
  vice: AstralVice;
  fid: number;
}

export function ViceCard({ vice, fid }: ViceCardProps) {
  return (
    <Card className="w-full max-w-md mx-auto bg-black/60 backdrop-blur-sm border-2" style={{ borderColor: vice.color }}>
      <CardHeader className="pb-3">
        <CardTitle className="text-xl sm:text-2xl text-center font-bold" style={{ color: vice.color }}>
          {vice.name}
        </CardTitle>
        <div className="flex flex-wrap justify-center gap-2 mt-2">
          <Badge variant="outline" className="text-xs" style={{ borderColor: vice.color, color: vice.color }}>
            {vice.element} Aura
          </Badge>
          <Badge variant="outline" className="text-xs" style={{ borderColor: vice.color, color: vice.color }}>
            {vice.power}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 px-3 pb-4">
        <div 
          className="w-full aspect-square bg-cover bg-center bg-no-repeat rounded-lg border-2 relative overflow-hidden shadow-lg"
          style={{
            backgroundImage: `url(${vice.imageUrl})`,
            borderColor: vice.color,
            boxShadow: `0 0 30px ${vice.color}40`
          }}
        >
          <div 
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(circle at center, ${vice.color} 0%, transparent 70%)`
            }}
          />
        </div>
        
        <div className="space-y-2">
          <p className="text-sm sm:text-base text-gray-300 text-center leading-relaxed px-2">
            {vice.description}
          </p>
          
          <div className="flex justify-center items-center gap-3 text-xs text-gray-500 pt-1">
            <div className="flex items-center gap-1">
              <span className="font-semibold">FID:</span>
              <span className="font-mono">{fid}</span>
            </div>
            {fid === 0 && (
              <Badge variant="secondary" className="text-xs bg-yellow-900/30 text-yellow-400 border-yellow-600">
                Limited Edition
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
