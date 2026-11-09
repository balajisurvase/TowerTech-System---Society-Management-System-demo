import React from 'react';

export default function SkeletonFallback() {
  return (
    <div className="w-full space-y-4 p-6 animate-pulse bg-white/50 rounded-2xl border border-purple-100">
      <div className="h-8 bg-purple-100/60 rounded-xl w-1/3 mb-6"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="h-28 bg-purple-100/40 rounded-2xl"></div>
        <div className="h-28 bg-purple-100/40 rounded-2xl"></div>
        <div className="h-28 bg-purple-100/40 rounded-2xl"></div>
      </div>
      <div className="h-64 bg-purple-100/30 rounded-2xl w-full"></div>
    </div>
  );
}
