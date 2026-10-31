import React from 'react';

interface TowerTechLogoProps {
  className?: string;
  type?: 'icon' | 'full';
}

export default function TowerTechLogo({ className = "w-10 h-10", type = 'icon' }: TowerTechLogoProps) {
  const src = type === 'full' 
    ? "/assets/aistudio/WhatsApp_Image_2026-10-30_at_7.34.34_AM_4da538a9.jpeg"
    : "/assets/aistudio/WhatsApp_Image_2026-10-30_at_7.38.51_AM_55701429.jpeg";
    
  return (
    <img 
      src={src} 
      alt="TowerTech Logo" 
      className={`${className} object-contain`}
    />
  );
}
