'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Design tokens matching welcome page
const C = {
  primary: '#0EA5E9',
  primaryDk: '#0369A1',
  accent: '#6366F1',
  bg: '#F0F9FF',
  surface: '#FFFFFF',
  border: '#E0EFFA',
  text1: '#0C1A2E',
  text2: '#3D5A7A',
  text3: '#8AAABF',
  green: '#16A34A',
  greenBg: '#DCFCE7',
  red: '#DC2626',
  redBg: '#FEE2E2',
  amber: '#D97706',
  amberBg: '#FEF3C7',
  purple: '#7C3AED',
  purpleBg: '#EDE9FE',
};

const FONT_DISPLAY = "'Clash Display','Plus Jakarta Sans',sans-serif";
const FONT_BODY = "'Plus Jakarta Sans',system-ui,sans-serif";

// MO character component
function MOAvatar({ size = 64 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <style>
          {`
          #mo-head {
            transform-origin: 40px 58px;
            animation: headTilt 1.8s ease-in-out infinite;
          }
          @keyframes headTilt {
            0%   { transform: rotate(0deg); }
            20%  { transform: rotate(-8deg); }
            50%  { transform: rotate(7deg); }
            80%  { transform: rotate(-5deg); }
            100% { transform: rotate(0deg); }
          }
          #eye-left {
            animation: eyeLeft 1.8s ease-in-out infinite;
          }
          #eye-right {
            animation: eyeRight 1.8s ease-in-out infinite;
          }
          @keyframes eyeLeft {
            0%,100% { transform: translate(0,0); }
            20%     { transform: translate(-1.5px, 0.5px); }
            50%     { transform: translate(1.5px, 0px); }
            80%     { transform: translate(-1px, 0px); }
          }
          @keyframes eyeRight {
            0%,100% { transform: translate(0,0); }
            20%     { transform: translate(-1.5px, 0.5px); }
            50%     { transform: translate(1.5px, 0px); }
            80%     { transform: translate(-1px, 0px); }
          }
          #dot1 { animation: floatDot 1.8s ease-in-out infinite 0s; }
          #dot2 { animation: floatDot 1.8s ease-in-out infinite 0.3s; }
          #dot3 { animation: floatDot 1.8s ease-in-out infinite 0.6s; }
          @keyframes floatDot {
            0%   { transform: translateY(0px); opacity: 0; }
            20%  { opacity: 1; }
            70%  { transform: translateY(-8px); opacity: 0.9; }
            100% { transform: translateY(-14px); opacity: 0; }
          }
          #mo-mouth {
            animation: mouthThink 1.8s ease-in-out infinite;
          }
          @keyframes mouthThink {
            0%,100% { d: path("M30 43 Q40 50 50 43"); }
            30%,70% { d: path("M32 45 Q40 45 48 45"); }
          }
          #blush-left, #blush-right {
            animation: blushPulse 1.8s ease-in-out infinite;
          }
          @keyframes blushPulse {
            0%,100% { opacity: 0.35; }
            50%     { opacity: 0.6; }
          }
          `}
        </style>
      </defs>

      <circle cx="40" cy="40" r="38" fill="#162334"/>

      <circle id="dot1" cx="55" cy="18" r="2" fill="#1DB954"/>
      <circle id="dot2" cx="61" cy="13" r="2.5" fill="#1DB954"/>
      <circle id="dot3" cx="68" cy="7" r="3" fill="#1DB954"/>

      <g id="mo-head">
        <circle cx="40" cy="37" r="21" fill="#F5C9A0"/>
        <path d="M19 33 C19 19 61 19 61 33 L61 26 C61 14 19 14 19 26 Z" fill="#2C1A0E"/>
        <ellipse cx="31" cy="36" rx="4" ry="4.5" fill="#1A2B3C"/>
        <ellipse cx="49" cy="36" rx="4" ry="4.5" fill="#1A2B3C"/>
        <g id="eye-left">
          <circle cx="32.5" cy="34.5" r="1.5" fill="white"/>
        </g>
        <g id="eye-right">
          <circle cx="50.5" cy="34.5" r="1.5" fill="white"/>
        </g>
        <ellipse id="blush-left"  cx="23" cy="41" rx="4" ry="2.5" fill="#F4A535" opacity="0.35"/>
        <ellipse id="blush-right" cx="57" cy="41" rx="4" ry="2.5" fill="#F4A535" opacity="0.35"/>
        <path id="mo-mouth" d="M30 43 Q40 50 50 43" stroke="#CC7A3A" strokeWidth="2" strokeLinecap="round" fill="none"/>
      </g>

      <ellipse cx="40" cy="65" rx="16" ry="7" fill="#1DB954" opacity="0.9"/>
      <rect x="32" y="58" width="16" height="9" rx="5" fill="#F5C9A0"/>
      <polygon points="36,58 44,58 42,66 38,66" fill="#1DB954"/>
    </svg>
  );
}

interface Lesson {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  read_time: string;
  content: {
    sections: Array<{
      type: string;
      level?: number;
      content: string;
      items?: string[];
      url?: string;
      caption?: string;
    }>;
  };
  category: string;
  difficulty: string;
}

export default function LessonPage() {
  const params = useParams();
  const router = useRouter();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchLesson() {
      try {
        const response = await fetch(`/api/lessons/${params.slug}`);
        if (!response.ok) {
          throw new Error('Lesson not found');
        }
        const data = await response.json();
        setLesson(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load lesson');
      } finally {
        setLoading(false);
      }
    }

    fetchLesson();
  }, [params.slug]);

  // Progress tracking
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        const scrollProgress = (scrollTop / (scrollHeight - clientHeight)) * 100;
        setProgress(Math.min(100, Math.max(0, scrollProgress)));
      }
    };

    const contentElement = contentRef.current;
    if (contentElement) {
      contentElement.addEventListener('scroll', handleScroll);
      return () => contentElement.removeEventListener('scroll', handleScroll);
    }
  }, [lesson]);

  if (loading) {
    return (
      <div style={{ 
        fontFamily: FONT_BODY, 
        background: C.bg, 
        color: C.text1, 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <MOAvatar size={80} />
          <p style={{ marginTop: 20, color: C.text2 }}>Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div style={{ 
        fontFamily: FONT_BODY, 
        background: C.bg, 
        color: C.text1, 
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}>
        <div style={{ textAlign: 'center', maxWidth: 400 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
          <h2 style={{ fontFamily: FONT_DISPLAY, fontSize: 24, marginBottom: 8 }}>
            Lesson not found
          </h2>
          <p style={{ color: C.text2, marginBottom: 24 }}>
            {error || "We couldn't find the lesson you're looking for."}
          </p>
          <button
            onClick={() => router.push('/welcome')}
            style={{
              background: C.primary,
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: FONT_BODY
            }}
          >
            Back to Welcome
          </button>
        </div>
      </div>
    );
  }

  function renderContentSection(section: any, index: number) {
    switch (section.type) {
      case 'heading':
        const HeadingTag = `h${section.level || 2}` as keyof React.JSX.IntrinsicElements;
        return (
          <HeadingTag
            key={index}
            style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 700,
              fontSize: section.level === 2 ? '28px' : section.level === 3 ? '22px' : '18px',
              color: C.text1,
              marginTop: section.level === 2 ? '48px' : '32px',
              marginBottom: '16px',
              letterSpacing: '-0.025em'
            }}
          >
            {section.content}
          </HeadingTag>
        );

      case 'paragraph':
        return (
          <div
            key={index}
            style={{
              fontSize: 16,
              lineHeight: 1.8,
              color: C.text2,
              marginBottom: 24,
            }}
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {section.content}
            </ReactMarkdown>
          </div>
        );

      case 'list':
        return (
          <ul
            key={index}
            style={{
              marginBottom: 24,
              paddingLeft: 24,
              color: C.text2,
              lineHeight: 1.8
            }}
          >
            {section.items?.map((item: string, i: number) => (
              <li key={i} style={{ marginBottom: 8 }}>{item}</li>
            ))}
          </ul>
        );

      case 'tip':
        return (
          <div
            key={index}
            style={{
              background: C.amberBg,
              border: `1px solid ${C.amber}`,
              borderRadius: 12,
              padding: 20,
              marginBottom: 24,
              display: 'flex',
              gap: 16,
              alignItems: 'flex-start'
            }}
          >
            <MOAvatar size={40} />
            <div>
              <div style={{
                fontFamily: FONT_DISPLAY,
                fontWeight: 700,
                fontSize: 14,
                color: C.amber,
                marginBottom: 8
              }}>
                MO's Tip
              </div>
              <div style={{ fontSize: 15, color: C.text2, lineHeight: 1.6 }}>
                {section.content}
              </div>
            </div>
          </div>
        );

      case 'image':
        return (
          <div key={index} style={{ marginBottom: 24 }}>
            <img
              src={section.url}
              alt={section.caption || ''}
              style={{
                width: '100%',
                borderRadius: 12,
                marginBottom: 12
              }}
            />
            {section.caption && (
              <div style={{
                fontSize: 13,
                color: C.text3,
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                {section.caption}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  }

  return (
    <div style={{ fontFamily: FONT_BODY, background: C.bg, color: C.text1, minHeight: '100vh' }}>
      {/* Progress bar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: 'rgba(14, 165, 233, 0.2)',
        zIndex: 1000
      }}>
        <div style={{
          height: '100%',
          background: C.primary,
          width: `${progress}%`,
          transition: 'width 0.1s ease'
        }} />
      </div>

      {/* Header */}
      <header style={{
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        padding: '20px 5%',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => router.push('/welcome')}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 8,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: C.text2,
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = C.bg}
            onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: C.text3, marginBottom: 4 }}>
              {lesson.category} • {lesson.difficulty}
            </div>
            <div style={{ 
              fontFamily: FONT_DISPLAY, 
              fontWeight: 700, 
              fontSize: 18,
              color: C.text1 
            }}>
              {lesson.title}
            </div>
          </div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            color: C.text3
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            {lesson.read_time}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main 
        ref={contentRef}
        style={{
          maxWidth: 800,
          margin: '0 auto',
          padding: '40px 20px 80px',
          scrollBehavior: 'smooth'
        }}
      >
        {/* Lesson header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>{lesson.icon}</div>
          <h1 style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 800,
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            color: C.text1,
            marginBottom: 16,
            letterSpacing: '-0.025em',
            lineHeight: 1.2
          }}>
            {lesson.title}
          </h1>
          <p style={{
            fontSize: 18,
            color: C.text2,
            lineHeight: 1.6,
            maxWidth: 600
          }}>
            {lesson.description}
          </p>
        </div>

        {/* Content sections */}
        {lesson.content?.sections?.map((section, index) => renderContentSection(section, index))}

        {/* Completion message */}
        <div style={{
          background: C.greenBg,
          border: `1px solid ${C.green}`,
          borderRadius: 16,
          padding: 32,
          marginTop: 48,
          textAlign: 'center'
        }}>
          <MOAvatar size={64} />
          <h3 style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: 20,
            color: C.green,
            marginTop: 16,
            marginBottom: 8
          }}>
            Lesson Complete! 🎉
          </h3>
          <p style={{ color: C.text2, marginBottom: 24 }}>
            Great job making it through this lesson. Now put what you've learned into action!
          </p>
          <button
            onClick={() => router.push('/lessons')}
            style={{
              background: C.green,
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: FONT_BODY
            }}
          >
            Browse More Lessons
          </button>
        </div>
      </main>
    </div>
  );
}
