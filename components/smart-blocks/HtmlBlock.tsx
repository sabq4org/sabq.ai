'use client';

import React from 'react';

interface HtmlBlockProps {
  block: {
    id: string;
    name: string;
    customHtml?: string;
    theme: {
      primaryColor: string;
      backgroundColor: string;
      textColor: string;
    };
  };
}

export const HtmlBlock: React.FC<HtmlBlockProps> = ({ block }) => {
  if (!block.customHtml) {
    return null;
  }

  return (
    <div 
      className="w-full html-block-container"
      style={{
        '--primary-color': block.theme.primaryColor,
        '--bg-color': block.theme.backgroundColor,
        '--text-color': block.theme.textColor,
      } as React.CSSProperties}
    >
      <div 
        dangerouslySetInnerHTML={{ __html: block.customHtml }}
        className="html-block-content"
      />
    </div>
  );
}; 