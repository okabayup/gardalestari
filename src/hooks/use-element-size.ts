
'use client';

import { useState, useLayoutEffect, useCallback } from 'react';

// A hook to get the size of an element.
export function useElementSize<T extends HTMLElement = HTMLDivElement>(): [
  (node: T | null) => void,
  { width: number; height: number }
] {
  const [ref, setRef] = useState<T | null>(null);
  const [size, setSize] = useState({
    width: 0,
    height: 0,
  });

  const handleSize = useCallback(() => {
    if (ref) {
      setSize({
        width: ref.offsetWidth,
        height: ref.offsetHeight,
      });
    }
  }, [ref]);

  useLayoutEffect(() => {
    handleSize();
    window.addEventListener('resize', handleSize);
    return () => window.removeEventListener('resize', handleSize);
  }, [handleSize]);

  return [setRef, size];
}
