'use client';

import { useState, useEffect } from 'react';

export default function MigrationBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('migration-banner-dismissed');
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    sessionStorage.setItem('migration-banner-dismissed', '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/40 backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Popup */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Informasi Migrasi Server"
        className="fixed z-[9999] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                   w-[90vw] max-w-md rounded-2xl shadow-2xl overflow-hidden
                   bg-white text-gray-800"
      >
        {/* Header merah-putih */}
        <div className="bg-red-600 px-5 pt-4 pb-3 flex items-center gap-3">
          {/* Logo Bangga Buatan Indonesia (SVG inline) */}
          <div className="shrink-0">
            <svg viewBox="0 0 64 64" width="48" height="48" xmlns="http://www.w3.org/2000/svg">
              {/* Lingkaran putih */}
              <circle cx="32" cy="32" r="30" fill="white" />
              {/* Setengah bawah merah */}
              <path d="M2 32 a30 30 0 0 0 60 0 Z" fill="#CE1126" />
              {/* Bintang di tengah */}
              <polygon
                points="32,14 34.9,22.6 44,22.6 36.6,27.8 39.5,36.4 32,31.2 24.5,36.4 27.4,27.8 20,22.6 29.1,22.6"
                fill="#FFD700"
              />
              {/* Teks atas */}
              <text x="32" y="50" textAnchor="middle" fontSize="5.5" fontWeight="bold"
                    fill="white" fontFamily="Arial,sans-serif">BUATAN INDONESIA</text>
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Bangga Buatan Indonesia 🇮🇩</p>
            <p className="text-red-100 text-xs">Server lokal · Berdikari digital</p>
          </div>
          <button
            onClick={dismiss}
            className="ml-auto text-white/70 hover:text-white text-xl leading-none"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <div className="flex items-start gap-3 mb-4">
            <span className="text-2xl mt-0.5">🔄</span>
            <div>
              <h2 className="font-bold text-base text-gray-900 mb-1">
                Website Sedang Dalam Proses Migrasi
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Kami sedang memindahkan layanan dari <strong>Google Cloud</strong> ke{' '}
                <strong>server lokal Indonesia</strong> 🇮🇩 untuk performa lebih baik dan
                kemandirian digital.
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
            <p className="text-xs text-amber-800 leading-relaxed">
              ⚠️ Beberapa fitur mungkin mengalami <strong>gangguan sementara</strong> selama
              proses migrasi berlangsung. Mohon maklum dan maaf atas ketidaknyamanannya.
            </p>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full w-3/5 bg-gradient-to-r from-red-500 to-red-400 rounded-full animate-pulse" />
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">~60%</span>
          </div>

          <button
            onClick={dismiss}
            className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700
                       text-white font-semibold text-sm transition-colors"
          >
            Mengerti, Lanjutkan
          </button>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-5 py-2.5 text-center">
          <p className="text-[10px] text-gray-400">
            Gardalestari.org · Yayasan Generasi Konservasi Nusantara
          </p>
        </div>
      </div>
    </>
  );
}
