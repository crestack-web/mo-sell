'use client';

import React from 'react';
import { Bell, BellOff, ChevronLeft, ChevronRight, Plus, Send, CalendarClock, CheckCircle2, Pencil, X } from 'lucide-react';
import { s, PLATFORMS, daysOfWeek, toDateInput, AddFormDefault, Spinner } from './shared';
import { useContentHub } from './ContentHubContext';
import { CalendarPost } from './shared';

const platformIcon = (key: string) => PLATFORMS.find(p => p.key === key)?.icon || '•';

export function CalendarTab() {
  const {
    calendarPosts, calendarLoading, calMonth, setCalMonth,
    addFormOpen, setAddFormOpen, editingPostId, setEditingPostId, dayOpen, setDayOpen,
    addForm, setAddForm, reminderOn, setReminderOn,
    handleSavePost, handleTogglePostStatus, handleDeletePost,
    products,
  } = useContentHub();

  const todayKey = toDateInput(new Date());
  const editingPost = editingPostId ? calendarPosts.find(p => p.id === editingPostId) : null;
  const openDayPosts = dayOpen ? calendarPosts.filter(p => p.date === dayOpen) : [];

  return (
    <div>
      <div style={s.cardHeader}>
        <div>
          <p style={s.cardTitle}>Content Calendar</p>
          <p style={s.cardSub}>Schedule ideas from the Ideas tab, then mark posts as published to track your social postings</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', padding: '4px 6px' }}>
            <button
              onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1, 1))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sell-text-2)', display: 'flex', padding: 2 }}
              title="Previous month"
              aria-label="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--sell-text-1)', minWidth: 120, textAlign: 'center' }}>
              {calMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 1))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sell-text-2)', display: 'flex', padding: 2 }}
              title="Next month"
              aria-label="Next month"
            >
              <ChevronRight size={16} />
            </button>
          </div>
          <button
            onClick={() => { setEditingPostId(null); setAddForm({ ...AddFormDefault, date: toDateInput(new Date()) }); setAddFormOpen(true); }}
            style={s.btnPrimary}
          >
            <Plus size={14} />
            Schedule Post
          </button>
          <button
            onClick={() => setReminderOn(!reminderOn)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 'var(--sell-radius-sm)',
              border: '1px solid var(--sell-border)', background: 'var(--sell-surface)', cursor: 'pointer',
              fontSize: '0.78rem', fontWeight: 600, color: reminderOn ? 'var(--sell-primary)' : 'var(--sell-text-3)',
            }}
            title="Picks up pending posts in Ask MO"
            aria-pressed={reminderOn}
          >
            {reminderOn ? <Bell size={14} /> : <BellOff size={14} />}
            {reminderOn ? 'Ask MO Reminders On' : 'Ask MO Reminders Off'}
          </button>
        </div>
      </div>
      <div style={s.cardBody}>
        {/* Add / edit post form */}
        {addFormOpen && (
          <div style={{ border: '1px solid var(--sell-primary)', borderRadius: 'var(--sell-radius-sm)', padding: 16, background: 'var(--sell-primary-lt)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--sell-text-1)' }}>
              <CalendarClock size={14} style={{ verticalAlign: -2, marginRight: 6 }} />
              {editingPost ? 'Edit post' : 'Schedule a post'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 10 }}>
              <input
                style={s.formInput}
                placeholder="Post title / idea (e.g. 'Unboxing hook reel')"
                value={addForm.title}
                onChange={e => setAddForm(prev => ({ ...prev, title: e.target.value }))}
              />
              <select
                style={s.formInput}
                value={addForm.platform}
                onChange={e => setAddForm(prev => ({ ...prev, platform: e.target.value }))}
              >
                {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.icon} {p.label}</option>)}
              </select>
              <input
                style={s.formInput}
                type="date"
                value={addForm.date}
                onChange={e => setAddForm(prev => ({ ...prev, date: e.target.value }))}
              />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 10 }}>
              <input
                style={s.formInput}
                type="time"
                value={addForm.time}
                onChange={e => setAddForm(prev => ({ ...prev, time: e.target.value }))}
              />
              <select
                style={s.formInput}
                value={addForm.productId}
                onChange={e => setAddForm(prev => ({ ...prev, productId: e.target.value }))}
              >
                <option value="">No product</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.displayName}</option>)}
              </select>
              <input
                style={s.formInput}
                placeholder="Notes (format, CTA, script ref…)"
                value={addForm.notes}
                onChange={e => setAddForm(prev => ({ ...prev, notes: e.target.value }))}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={s.btnPrimary} onClick={handleSavePost}>
                <Send size={13} />
                {editingPost ? 'Save Changes' : 'Save to Calendar'}
              </button>
              <button style={s.btnGhost} onClick={() => { setAddFormOpen(false); setEditingPostId(null); }}>Cancel</button>
            </div>
          </div>
        )}

        {/* Month grid */}
        {calendarLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32, color: 'var(--sell-text-3)', fontSize: '0.85rem', gap: 8 }}>
            <Spinner size={18} />
            Loading calendar…
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 8 }}>
            {daysOfWeek.map(day => (
              <div key={day} style={{ textAlign: 'center', fontWeight: 600, fontSize: '0.78rem', color: 'var(--sell-text-3)', padding: '6px 0' }}>
                {day}
              </div>
            ))}
            {(() => {
              const monthStart = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1);
              const firstWeekday = (monthStart.getDay() + 6) % 7;
              const daysInMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0).getDate();
              const cells: (Date | null)[] = [
                ...Array.from({ length: firstWeekday }, () => null),
                ...Array.from({ length: daysInMonth }, (_, i) => new Date(calMonth.getFullYear(), calMonth.getMonth(), i + 1)),
              ];
              return cells.map((d, idx) => {
                if (!d) return <div key={idx} />;
                const key = toDateInput(d);
                const posts = calendarPosts.filter(p => p.date === key);
                const isToday = key === todayKey;
                return (
                  <div
                    key={idx}
                    style={{
                      border: `1px solid ${isToday ? 'var(--sell-primary)' : 'var(--sell-border)'}`,
                      borderRadius: 'var(--sell-radius-sm)',
                      background: 'var(--sell-bg)',
                      padding: 6,
                      minHeight: 96,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: isToday ? 'var(--sell-primary)' : 'var(--sell-text-1)' }}>{d.getDate()}</span>
                      <button
                        onClick={() => { setAddForm(prev => ({ ...prev, date: key })); setEditingPostId(null); setAddFormOpen(true); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sell-text-3)', display: 'flex', padding: 1 }}
                        title="Add a post on this day"
                        aria-label={`Add a post on ${key}`}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    {posts.slice(0, 3).map(p => (
                      <PostChip key={p.id} post={p} onToggle={() => handleTogglePostStatus(p)} onEdit={() => { setAddForm({ title: p.title, platform: p.platform, date: p.date, time: p.time || '12:00', productId: p.productId || '', notes: p.notes || '' }); setEditingPostId(p.id); setAddFormOpen(true); }} onDelete={() => handleDeletePost(p.id)} />
                    ))}
                    {posts.length > 3 && (
                      <button
                        onClick={() => setDayOpen(key)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, textAlign: 'left', fontSize: '0.6rem', color: 'var(--sell-primary)', fontWeight: 600 }}
                        title={`View all ${posts.length} posts on ${key}`}
                        aria-label={`View all ${posts.length} posts on ${key}`}
                      >
                        +{posts.length - 3} more
                      </button>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* Day detail modal */}
      {dayOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }} onClick={() => setDayOpen(null)}>
          <div style={{ background: 'var(--sell-surface)', borderRadius: 'var(--sell-radius-lg)', maxWidth: 480, width: '100%', maxHeight: '85dvh', overflow: 'auto', padding: 24, position: 'relative', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
            <button onClick={() => setDayOpen(null)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, display: 'flex', color: 'var(--sell-text-3)' }} aria-label="Close day details">
              <X size={18} />
            </button>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--sell-text-1)', marginBottom: 4 }}>
              {new Date(dayOpen).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--sell-text-3)', marginBottom: 16 }}>{openDayPosts.length} post{openDayPosts.length !== 1 ? 's' : ''}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {openDayPosts.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius-sm)', padding: '10px 12px', background: 'var(--sell-bg)' }}>
                  <span style={{ fontSize: '1rem', flexShrink: 0 }}>{platformIcon(p.platform)}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--sell-text-1)', textDecoration: p.status === 'posted' ? 'line-through' : 'none' }}>{p.title}</span>
                      {p.status === 'posted' && <CheckCircle2 size={12} color="var(--sell-green)" />}
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--sell-text-3)', margin: 0 }}>{p.time || '12:00'}{p.notes ? ` · ${p.notes}` : ''}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                    <button
                      onClick={() => handleTogglePostStatus(p)}
                      style={{ ...s.btnGhost, fontSize: '0.65rem', padding: '4px 8px', color: p.status === 'posted' ? 'var(--sell-text-3)' : 'var(--sell-green)' }}
                      title={p.status === 'posted' ? 'Mark as scheduled' : 'Mark as posted'}
                    >
                      <CheckCircle2 size={11} />
                      {p.status === 'posted' ? 'Unpost' : 'Post'}
                    </button>
                    <button
                      onClick={() => { setAddForm({ title: p.title, platform: p.platform, date: p.date, time: p.time || '12:00', productId: p.productId || '', notes: p.notes || '' }); setEditingPostId(p.id); setAddFormOpen(true); setDayOpen(null); }}
                      style={{ ...s.btnGhost, fontSize: '0.65rem', padding: '4px 8px' }}
                      title="Edit post"
                      aria-label={`Edit post ${p.title}`}
                    >
                      <Pencil size={11} />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeletePost(p.id)}
                      style={{ ...s.btnGhost, fontSize: '0.65rem', padding: '4px 8px', color: 'var(--sell-red)' }}
                      title="Delete post"
                      aria-label={`Delete post ${p.title}`}
                    >
                      <X size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PostChip({ post, onToggle, onEdit, onDelete }: { post: CalendarPost; onToggle: () => void; onEdit: () => void; onDelete: () => void }) {
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center' }}>
      <button
        onClick={onToggle}
        title={(post.status === 'posted' ? 'Posted — click to mark scheduled' : 'Click to mark as posted') + (post.notes ? `\n${post.notes}` : '')}
        aria-label={post.status === 'posted' ? `Mark ${post.title} as scheduled` : `Mark ${post.title} as posted`}
        style={{
          display: 'flex', alignItems: 'center', gap: 3, fontSize: '0.6rem', textAlign: 'left',
          padding: '2px 6px', borderRadius: 6, border: '1px solid', cursor: 'pointer', flex: 1, minWidth: 0,
          background: post.status === 'posted' ? 'var(--sell-green-bg)' : 'var(--sell-surface-2)',
          borderColor: post.status === 'posted' ? 'var(--sell-green)' : 'var(--sell-border)',
          color: 'var(--sell-text-1)',
        }}
      >
        <span>{platformIcon(post.platform)}</span>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: post.status === 'posted' ? 'line-through' : 'none' }}>
          {post.title}
        </span>
        {post.status === 'posted' && <CheckCircle2 size={10} color="var(--sell-green)" />}
      </button>
      <button
        onClick={onEdit}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sell-text-3)', display: 'flex', padding: 2 }}
        title="Edit post"
        aria-label={`Edit post ${post.title}`}
      >
        <Pencil size={11} />
      </button>
      <button
        onClick={onDelete}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sell-text-3)', fontSize: '0.6rem', padding: 1 }}
        title="Delete post"
        aria-label={`Delete post ${post.title}`}
      >
        ✕
      </button>
    </div>
  );
}
