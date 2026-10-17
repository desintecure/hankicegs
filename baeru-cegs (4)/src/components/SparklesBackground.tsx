import React from 'react';

export const SparklesBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Left side sparkles */}
      <div className="absolute left-[3%] top-[25%] opacity-60 sparkle-float" style={{ animationDelay: '0s' }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 0C12 7 17 12 24 12C17 12 12 17 12 24C12 17 7 12 0 12C7 12 12 7 12 0Z" fill="#f472b6" />
        </svg>
      </div>
      <div className="absolute left-[7%] top-[45%] opacity-40 sparkle-float" style={{ animationDelay: '1.2s' }}>
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none">
          <path d="M12 0C12 7 17 12 24 12C17 12 12 17 12 24C12 17 7 12 0 12C7 12 12 7 12 0Z" fill="#f9a8d4" />
        </svg>
      </div>
      <div className="absolute left-[5%] top-[70%] opacity-50 sparkle-float" style={{ animationDelay: '2.1s' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M12 0C12 7 17 12 24 12C17 12 12 17 12 24C12 17 7 12 0 12C7 12 12 7 12 0Z" fill="#f472b6" />
        </svg>
      </div>

      {/* Right side sparkles */}
      <div className="absolute right-[4%] top-[18%] opacity-50 sparkle-float" style={{ animationDelay: '0.8s' }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
          <path d="M12 0C12 7 17 12 24 12C17 12 12 17 12 24C12 17 7 12 0 12C7 12 12 7 12 0Z" fill="#f472b6" />
        </svg>
      </div>
      <div className="absolute right-[8%] top-[55%] opacity-45 sparkle-float" style={{ animationDelay: '1.8s' }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
          <path d="M12 0C12 7 17 12 24 12C17 12 12 17 12 24C12 17 7 12 0 12C7 12 12 7 12 0Z" fill="#f9a8d4" />
        </svg>
      </div>
      <div className="absolute right-[5%] top-[78%] opacity-60 sparkle-float" style={{ animationDelay: '2.5s' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M12 0C12 7 17 12 24 12C17 12 12 17 12 24C12 17 7 12 0 12C7 12 12 7 12 0Z" fill="#f472b6" />
        </svg>
      </div>
    </div>
  );
};
