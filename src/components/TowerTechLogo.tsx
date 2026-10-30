import React from 'react';

export default function TowerTechLogo({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <img 
      src="/assets/aistudio/WhatsApp_Image_2026-10-30_at_7.38.51_AM_55701429.jpeg" 
      alt="TowerTech Logo" 
      className={`${className} object-contain`}
    />
  );
}
