
import React from 'react';

interface SampleLimitsDisplayProps {
  samplesRemaining: number;
  revisionsRemaining: number;
  isSampleMode: boolean;
  totalSamples?: number;
}

export const SampleLimitsDisplay: React.FC<SampleLimitsDisplayProps> = ({ 
  samplesRemaining, 
  revisionsRemaining,
  isSampleMode,
  totalSamples = 1
}) => {
  if (!isSampleMode) return null;

  return (
    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs font-bold text-blue-800 flex flex-wrap gap-4 justify-center items-center shadow-sm mb-4">
      <div className="flex items-center gap-1">
        <span>📚 Free Samples:</span>
        <span className={`${samplesRemaining === 0 ? 'text-red-600' : 'text-green-600'}`}>{samplesRemaining}/{totalSamples}</span>
      </div>
      <div className="w-px h-3 bg-blue-200 hidden sm:block"></div>
      <div className="flex items-center gap-1">
        <span>🔄 Revisions:</span>
        <span className={`${revisionsRemaining === 0 ? 'text-red-600' : 'text-green-600'}`}>{revisionsRemaining}/1</span>
      </div>
    </div>
  );
};
