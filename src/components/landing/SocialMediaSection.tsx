'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Smartphone, Instagram, Sparkles } from 'lucide-react';

const TikTokEmbed = ({ url, isActive }: { url: string; isActive: boolean }) => {
  // Extracting video ID from short link would normally happen via redirect, 
  // but for embedding we use the full tiktok link or the specific embed pattern.
  // Note: Standard vt.tiktok.com links don't always work in iframes without the full URL.
  // Using a simplified placeholder/link approach or standard iframe if ID is known.
  
  const videoId = url.includes('ZSu2N9gwB') ? '7478234567890123456' : '7478234567890123457'; // Simplified for example
  
  return (
    <div className="relative aspect-[9/16] w-full bg-black rounded-[2rem] overflow-hidden shadow-2xl border-4 border-accent/10">
      <iframe
        src={`https://www.tiktok.com/embed/v2/${url.split('/').filter(Boolean).pop()}?lang=id-ID&autoplay=${isActive ? 1 : 0}`}
        className="absolute inset-0 w-full h-full"
        allow="autoplay; encrypted-media"
        allowFullScreen
      />
    </div>
  );
};

export default function SocialMediaSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const videos = [
    "https://vt.tiktok.com/ZSu2N9gwB/",
    "https://vt.tiktok.com/ZSu2NgeYg/"
  ];

  return (
    <section ref={sectionRef} className="py-20 md:py-32 bg-muted/20 overflow-hidden">
      <div className="container px-6">
        <div className="flex flex-col items-center text-center mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-[10px] md:text-xs font-bold uppercase tracking-widest">
            <Instagram size={14} /> Sorotan Media Sosial
          </div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-accent">Aksi di Balik Layar</h2>
          <p className="max-w-xl text-muted-foreground font-medium">
            Ikuti perjalanan kami secara real-time melalui platform sosial. Dari lapangan hingga inovasi laboratorium.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          {videos.map((url, i) => (
            <div key={i} className="flex justify-center">
              <div className="relative w-full max-w-[300px]">
                {/* Smartphone Frame Decoration */}
                <div className="absolute -inset-4 border border-accent/5 rounded-[3rem] -z-10 bg-white/50 backdrop-blur-sm shadow-inner" />
                <TikTokEmbed url={url} isActive={isVisible} />
                <div className="mt-6 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary">
                   <Sparkles size={12} /> Video Terpopuler #{i + 1}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
