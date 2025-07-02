'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export function usePortalDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const renderDropdown = (content: React.ReactNode) => {
    if (!mounted || !isOpen || !buttonRef.current) return null;

    const rect = buttonRef.current.getBoundingClientRect();

    return createPortal(
      <div
        ref={dropdownRef}
        style={{
          position: 'fixed',
          top: `${rect.bottom + 8}px`,
          left: `${rect.left}px`,
          zIndex: 2147483647, // أعلى قيمة ممكنة
        }}
      >
        {content}
      </div>,
      document.body
    );
  };

  return {
    isOpen,
    setIsOpen,
    buttonRef,
    renderDropdown,
    toggle: () => setIsOpen(!isOpen)
  };
} 