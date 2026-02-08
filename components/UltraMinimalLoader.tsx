import React from 'react';
import { Code2 } from 'lucide-react';

const UltraMinimalLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#fafafa]">
      {/* Soft Glass Blur Layer */}
      <div className="absolute inset-0 backdrop-blur-[18px] bg-white/40 pointer-events-none" />
      
      <div className="relative z-10 flex flex-col items-center animate-premium-entry">
        {/* Premium B&W Minimal Logo */}
        <div className="w-16 h-16 bg-black rounded-[22px] flex items-center justify-center text-white mb-5 shadow-[0_15px_30px_rgba(0,0,0,0.08)]">
          <Code2 size={32} strokeWidth={2.5} />
        </div>
        
        {/* App Branding Only */}
        <h1 className="text-[24px] font-black tracking-tighter text-black">CodeNexus</h1>
      </div>
    </div>
  );
};

export default UltraMinimalLoader;