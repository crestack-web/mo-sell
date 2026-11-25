'use client';

import React from 'react';

const LOGO = 'https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png';

/** Minimal full-screen loader: logo + thin sliding bar, neutral palette. */
export function SellLoader({ label }: { label?: string }) {
  return (
    <div className="sell-loader" role="status" aria-live="polite">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={LOGO} alt="MO Sell" className="sell-loader__logo" />
      <div className="sell-loader__track" aria-hidden>
        <div className="sell-loader__bar" />
      </div>
      {label && <p className="sell-loader__label">{label}</p>}
      <style>{`
        .sell-loader {
          min-height: 100vh; min-height: 100dvh;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 20px;
          background: var(--sell-bg, #FAFAF9);
          font-family: var(--sell-font-body, 'Plus Jakarta Sans', sans-serif);
          animation: sellLoaderIn .3s ease both;
        }
        .sell-loader__logo { height: 34px; width: auto; object-fit: contain; }
        .sell-loader__track {
          width: 120px; height: 2px; border-radius: 99px; overflow: hidden;
          background: var(--sell-border, #ECECEA);
        }
        .sell-loader__bar {
          width: 40%; height: 100%; border-radius: 99px;
          background: var(--sell-text-1, #18181B);
          animation: sellLoaderSlide 1.1s cubic-bezier(.65,0,.35,1) infinite;
        }
        .sell-loader__label {
          margin: 0; font-size: 12px; font-weight: 500; letter-spacing: .01em;
          color: var(--sell-text-3, #A1A1AA);
        }
        @keyframes sellLoaderSlide { 0% { transform: translateX(-110%); } 100% { transform: translateX(260%); } }
        @keyframes sellLoaderIn { from { opacity: 0; } to { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) { .sell-loader__bar { animation-duration: 2.5s; } }
      `}</style>
    </div>
  );
}
