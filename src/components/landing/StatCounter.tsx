'use client';

import { useState, useEffect, useRef } from 'react';
import { useInView } from 'framer-motion';

interface StatCounterProps {
  target: number;
  duration?: number;
  suffix?: string;
  isK?: boolean;
}

export default function StatCounter({ target, duration = 2, suffix = '', isK = false }: StatCounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (isInView) {
      let startTime: number | null = null;
      let frameId: number;

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / (duration * 1000), 1);
        
        // Easing function: outQuart
        const easeOutQuart = (x: number): number => {
            return 1 - Math.pow(1 - x, 4);
        };
        
        const currentCount = Math.floor(easeOutQuart(progress) * target);
        setCount(currentCount);

        if (progress < 1) {
          frameId = requestAnimationFrame(animate);
        }
      };

      frameId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(frameId);
    }
  }, [isInView, target, duration]);

  const displayValue = isK && count >= 1000 
    ? (count / 1000).toFixed(0) + 'k' 
    : count.toLocaleString('id-ID');

  return <span ref={ref}>{displayValue}{suffix}</span>;
}
