import React, { useEffect, useRef, useState } from 'react';

interface TwitterEmbedProps {
  tweetUrl: string;
}

declare global {
  interface Window {
    twttr?: {
      widgets: {
        load: (element?: HTMLElement | null) => void;
      };
    };
  }
}

export const TwitterEmbed: React.FC<TwitterEmbedProps> = ({ tweetUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const renderTweet = () => {
      if (window.twttr && window.twttr.widgets) {
        window.twttr.widgets.load(containerRef.current);
        // Twitter replaces the blockquote with an iframe; check after a short delay
        const timer = setTimeout(() => {
          if (isMounted) setIsLoaded(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    };

    const scriptId = 'twitter-wjs';
    const existingScript = document.getElementById(scriptId);

    if (!existingScript) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.charset = 'utf-8';
      script.onload = () => {
        if (isMounted) {
          renderTweet();
        }
      };
      document.body.appendChild(script);
    } else {
      renderTweet();
    }

    // Interval check in case twttr loads asynchronously
    const checkTwttr = setInterval(() => {
      if (window.twttr && window.twttr.widgets) {
        window.twttr.widgets.load(containerRef.current);
        clearInterval(checkTwttr);
      }
    }, 500);

    const safetyTimeout = setTimeout(() => {
      clearInterval(checkTwttr);
      if (isMounted) setIsLoaded(true);
    }, 4000);

    return () => {
      isMounted = false;
      clearInterval(checkTwttr);
      clearTimeout(safetyTimeout);
    };
  }, [tweetUrl]);

  return (
    <div className="w-full flex flex-col items-center">
      <div
        ref={containerRef}
        className="w-full flex justify-center min-h-[300px] overflow-hidden"
      >
        <blockquote
          className="twitter-tweet"
          data-theme="light"
          data-conversation="none"
          data-align="center"
          data-lang="pt"
        >
          <p lang="pt" dir="ltr">
            Carregando feedbacks... ♡
          </p>
          <a href={tweetUrl}>Ver tweet original no Twitter/X</a>
        </blockquote>
      </div>

      {!isLoaded && (
        <div className="text-center text-xs text-pink-400 font-mono py-2 animate-pulse">
          carregando feed de feedbacks... ( ◡́.◡̀) ✨
        </div>
      )}

      {/* Fallback button if tweet doesn't load or is blocked by privacy extensions */}
      <div className="mt-3 text-center">
        <a
          href={tweetUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[0.72rem] text-pink-500 hover:text-pink-600 underline font-medium"
        >
          <i className="fab fa-twitter text-xs"></i> Abrir publicação diretamente no Twitter / X
        </a>
      </div>
    </div>
  );
};
