'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

interface Lesson {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  read_time: string;
  category: string;
  difficulty: string;
  featured: boolean;
}

export default function LessonsPage() {
  const router = useRouter();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  useEffect(() => {
    async function fetchLessons() {
      try {
        const response = await fetch('/api/lessons');
        if (response.ok) {
          const data = await response.json();
          setLessons(data);
          setFilteredLessons(data);
        }
      } catch (error) {
        console.error('Failed to fetch lessons:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchLessons();
  }, []);

  useEffect(() => {
    let filtered = lessons;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(lesson =>
        lesson.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(lesson => lesson.category === selectedCategory);
    }

    // Filter by difficulty
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(lesson => lesson.difficulty === selectedDifficulty);
    }

    setFilteredLessons(filtered);
  }, [searchQuery, selectedCategory, selectedDifficulty, lessons]);

  const categories = ['all', ...Array.from(new Set(lessons.map(l => l.category)))];
  const difficulties = ['all', ...Array.from(new Set(lessons.map(l => l.difficulty)))];

  function LessonCard({ lesson }: { lesson: Lesson }) {
    return (
      <div
        onClick={() => router.push(`/lessons/${lesson.slug}`)}
        style={{
          background: C.surface,
          borderRadius: 16,
          padding: 24,
          border: `1px solid ${C.border}`,
          boxShadow: '0 2px 12px rgba(14,88,140,0.06)',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          cursor: 'pointer',
          position: 'relative'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(14,165,233,0.12)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'none';
          e.currentTarget.style.boxShadow = '0 2px 12px rgba(14,88,140,0.06)';
        }}
      >
        {lesson.featured && (
          <div style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: C.amberBg,
            color: C.amber,
            padding: '4px 8px',
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase'
          }}>
            Featured
          </div>
        )}
        
        <div style={{ fontSize: 40 }}>{lesson.icon}</div>
        
        <div>
          <div style={{ 
            display: 'flex', 
            gap: 8, 
            marginBottom: 8,
            fontSize: 11,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            <span style={{ 
              background: C.bg, 
              color: C.text3, 
              padding: '4px 8px', 
              borderRadius: 4 
            }}>
              {lesson.category}
            </span>
            <span style={{ 
              background: lesson.difficulty === 'beginner' ? C.greenBg : 
                         lesson.difficulty === 'intermediate' ? C.amberBg : C.purpleBg,
              color: lesson.difficulty === 'beginner' ? C.green : 
                     lesson.difficulty === 'intermediate' ? C.amber : C.purple,
              padding: '4px 8px', 
              borderRadius: 4 
            }}>
              {lesson.difficulty}
            </span>
          </div>
          
          <h3 style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: 18,
            color: C.text1,
            marginBottom: 8,
            lineHeight: 1.3
          }}>
            {lesson.title}
          </h3>
          
          <p style={{
            fontSize: 14,
            color: C.text2,
            lineHeight: 1.6,
            marginBottom: 12
          }}>
            {lesson.description}
          </p>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            color: C.text3,
            fontWeight: 600
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
            {lesson.read_time}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: FONT_BODY, background: C.bg, color: C.text1, minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        background: C.surface,
        borderBottom: `1px solid ${C.border}`,
        padding: '20px 5%',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
          
          <h1 style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 700,
            fontSize: 20,
            color: C.text1
          }}>
            MO's Little Lessons
          </h1>
          
          <div style={{ width: 36 }} /> {/* Spacer for balance */}
        </div>
      </header>

      {/* Main content */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
        {/* Page header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{
            fontFamily: FONT_DISPLAY,
            fontWeight: 800,
            fontSize: 'clamp(2rem, 4vw, 2.5rem)',
            color: C.text1,
            marginBottom: 12,
            letterSpacing: '-0.025em'
          }}>
            Learn to Sell Smarter
          </h2>
          <p style={{
            fontSize: 16,
            color: C.text2,
            maxWidth: 600,
            margin: '0 auto'
          }}>
            Practical guides to help you grow your business, one lesson at a time.
          </p>
        </div>

        {/* Filters */}
        <div style={{
          background: C.surface,
          borderRadius: 12,
          padding: 24,
          marginBottom: 32,
          border: `1px solid ${C.border}`
        }}>
          {/* Search */}
          <div style={{ marginBottom: 20 }}>
            <input
              type="text"
              placeholder="Search lessons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 8,
                border: `1px solid ${C.border}`,
                fontSize: 14,
                fontFamily: FONT_BODY,
                outline: 'none',
                transition: 'border-color 0.2s'
              }}
              onFocus={(e) => e.currentTarget.style.borderColor = C.primary}
              onBlur={(e) => e.currentTarget.style.borderColor = C.border}
            />
          </div>

          {/* Category and difficulty filters */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: C.text3,
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  fontSize: 14,
                  fontFamily: FONT_BODY,
                  background: C.surface,
                  cursor: 'pointer'
                }}
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: 12,
                fontWeight: 600,
                color: C.text3,
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Difficulty
              </label>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${C.border}`,
                  fontSize: 14,
                  fontFamily: FONT_BODY,
                  background: C.surface,
                  cursor: 'pointer'
                }}
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty === 'all' ? 'All Levels' : difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
            <p style={{ color: C.text2 }}>Loading lessons...</p>
          </div>
        ) : filteredLessons.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h3 style={{
              fontFamily: FONT_DISPLAY,
              fontWeight: 700,
              fontSize: 20,
              color: C.text1,
              marginBottom: 8
            }}>
              No lessons found
            </h3>
            <p style={{ color: C.text2, marginBottom: 24 }}>
              Try adjusting your filters or search terms
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
                setSelectedDifficulty('all');
              }}
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
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Results count */}
            <div style={{
              fontSize: 14,
              color: C.text3,
              marginBottom: 24
            }}>
              Showing {filteredLessons.length} lesson{filteredLessons.length !== 1 ? 's' : ''}
            </div>

            {/* Lessons grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: 20
            }}>
              {filteredLessons.map(lesson => (
                <LessonCard key={lesson.id} lesson={lesson} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
