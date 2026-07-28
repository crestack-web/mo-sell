'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSell } from '@/context/SellContext';
import styles from './SellBookingsPage.module.css';

// ─── Types ────────────────────────────────────────────────────────────────────

type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serviceName: string;
  bookingDate: string;
  bookingTime: string;
  status: BookingStatus;
  notes: string;
  createdAt: Date;
}

interface DaySchedule {
  day: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface AvailabilityData {
  weeklySchedule: DaySchedule[];
  slotDuration: number;
  bufferTime: number;
  blockedDates: string[];
}

const DEFAULT_SCHEDULE: DaySchedule[] = [
  { day: 'Monday',    enabled: true,  startTime: '09:00', endTime: '17:00' },
  { day: 'Tuesday',   enabled: true,  startTime: '09:00', endTime: '17:00' },
  { day: 'Wednesday', enabled: true,  startTime: '09:00', endTime: '17:00' },
  { day: 'Thursday',  enabled: true,  startTime: '09:00', endTime: '17:00' },
  { day: 'Friday',    enabled: true,  startTime: '09:00', endTime: '17:00' },
  { day: 'Saturday',  enabled: false, startTime: '09:00', endTime: '14:00' },
  { day: 'Sunday',    enabled: false, startTime: '09:00', endTime: '14:00' },
];

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: 'Pending', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled',
};

function statusBadgeClass(s: BookingStatus): string {
  return {
    pending: styles.badgePending, confirmed: styles.badgeConfirmed,
    completed: styles.badgeCompleted, cancelled: styles.badgeCancelled,
  }[s] ?? styles.badgePending;
}

function fmtDate(d: string) {
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Booking Detail Slide-Over ────────────────────────────────────────────────

interface BookingSlideOverProps {
  booking: Booking;
  onClose: () => void;
  onStatusChange: (id: string, status: BookingStatus) => void;
}

function BookingSlideOver({ booking, onClose, onStatusChange }: BookingSlideOverProps) {
  const [busy, setBusy] = useState(false);

  const updateStatus = useCallback(async (status: BookingStatus) => {
    setBusy(true);
    try {
      await onStatusChange(booking.id, status);
    } finally { setBusy(false); }
  }, [booking.id, onStatusChange]);

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.slideover}>
        <div className={styles.slideoverHeader}>
          <div>
            <p className={styles.slideoverTitle}>Booking Details</p>
            <p className={styles.slideoverSub}>{booking.serviceName} · {fmtDate(booking.bookingDate)}</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className={styles.slideoverBody}>
          {/* Status */}
          <div>
            <p className={styles.sectionLabel}>Status</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
              <span className={`${styles.badge} ${statusBadgeClass(booking.status)}`}>
                <span className={styles.badgeDot} />{STATUS_LABELS[booking.status]}
              </span>
            </div>
          </div>

          {/* Actions */}
          {booking.status === 'pending' && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => updateStatus('confirmed')} disabled={busy}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Confirm
              </button>
              <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => updateStatus('cancelled')} disabled={busy}>
                Cancel
              </button>
            </div>
          )}
          {booking.status === 'confirmed' && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => updateStatus('completed')} disabled={busy}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                Mark completed
              </button>
              <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => updateStatus('cancelled')} disabled={busy}>
                Cancel
              </button>
            </div>
          )}

          {/* Service */}
          <div>
            <p className={styles.sectionLabel}>Service</p>
            <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--sell-text-1)', marginTop: 4 }}>{booking.serviceName}</p>
          </div>

          {/* Schedule */}
          <div>
            <p className={styles.sectionLabel}>Schedule</p>
            <div className={styles.infoGrid} style={{ marginTop: 4 }}>
              <div><p className={styles.infoKey}>Date</p><p className={styles.infoVal}>{fmtDate(booking.bookingDate)}</p></div>
              <div><p className={styles.infoKey}>Time</p><p className={styles.infoVal}>{booking.bookingTime}</p></div>
            </div>
          </div>

          {/* Customer */}
          <div>
            <p className={styles.sectionLabel}>Customer</p>
            <div className={styles.infoGrid} style={{ marginTop: 4 }}>
              <div><p className={styles.infoKey}>Name</p><p className={styles.infoVal}>{booking.customerName}</p></div>
              <div><p className={styles.infoKey}>Email</p><p className={styles.infoVal}>{booking.customerEmail}</p></div>
              <div><p className={styles.infoKey}>Phone</p><p className={styles.infoVal}>{booking.customerPhone || '—'}</p></div>
            </div>
          </div>

          {/* Notes */}
          {booking.notes && (
            <div>
              <p className={styles.sectionLabel}>Notes</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--sell-text-2)', lineHeight: 1.6, marginTop: 4 }}>{booking.notes}</p>
            </div>
          )}
        </div>

        <div className={styles.slideoverFooter}>
          <button className={`${styles.btn} ${styles.btnGhost}`} onClick={onClose}>Close</button>
        </div>
      </div>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function SellBookingsPage() {
  const { user, showToast } = useSell();

  // Tab state
  const [activeTab, setActiveTab] = useState<'bookings' | 'availability'>('bookings');

  // Bookings state
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'all' | BookingStatus>('all');
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);

  // Availability state
  const [schedule, setSchedule] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);
  const [slotDuration, setSlotDuration] = useState(60);
  const [bufferTime, setBufferTime] = useState(10);
  const [blockedDates, setBlockedDates] = useState<string[]>([]);
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [savingAvail, setSavingAvail] = useState(false);
  const [loadingAvail, setLoadingAvail] = useState(true);

  // ── Load bookings ──
  const loadBookings = useCallback(async () => {
    if (!user?.businessId) return;
    try {
      const res = await fetch(`/api/store/bookings?businessId=${user.businessId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const items: Booking[] = (data.bookings ?? []).map((b: any) => ({
        ...b,
        createdAt: b.createdAt ? new Date(b.createdAt) : new Date(),
      }));
      items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      setBookings(items);
    } catch (e) {
      console.error('[Bookings] Load error:', e);
    } finally { setLoadingBookings(false); }
  }, [user?.businessId]);

  // ── Load availability ──
  const loadAvailability = useCallback(async () => {
    if (!user?.businessId) return;
    try {
      const res = await fetch(`/api/store/bookings/availability?businessId=${user.businessId}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      if (data.weeklySchedule?.length) setSchedule(data.weeklySchedule);
      if (data.slotDuration) setSlotDuration(data.slotDuration);
      if (data.bufferTime != null) setBufferTime(data.bufferTime);
      if (data.blockedDates) setBlockedDates(data.blockedDates);
    } catch (e) {
      console.error('[Availability] Load error:', e);
    } finally { setLoadingAvail(false); }
  }, [user?.businessId]);

  useEffect(() => { loadBookings(); }, [loadBookings]);
  useEffect(() => { loadAvailability(); }, [loadAvailability]);

  // ── Update booking status ──
  const handleStatusChange = useCallback(async (id: string, status: BookingStatus) => {
    if (!user?.businessId) return;
    try {
      const res = await fetch(`/api/store/bookings/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ businessId: user.businessId, status }),
      });
      if (!res.ok) throw new Error();
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status } : b));
      setSelectedBooking(prev => prev && prev.id === id ? { ...prev, status } : prev);
      showToast(`Booking ${status}`, 'success');
    } catch {
      showToast('Failed to update booking', 'error');
    }
  }, [user?.businessId, showToast]);

  // ── Filter bookings ──
  const filtered = useMemo(() => bookings.filter(b => {
    return statusFilter === 'all' || b.status === statusFilter;
  }), [bookings, statusFilter]);

  const filterCounts = useMemo(() => ({
    all: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    cancelled: bookings.filter(b => b.status === 'cancelled').length,
  }), [bookings]);

  // ── Availability helpers ──
  const toggleDay = (index: number) => {
    setSchedule(prev => prev.map((d, i) => i === index ? { ...d, enabled: !d.enabled } : d));
  };

  const updateTime = (index: number, field: 'startTime' | 'endTime', value: string) => {
    setSchedule(prev => prev.map((d, i) => i === index ? { ...d, [field]: value } : d));
  };

  const addBlockedDate = () => {
    if (!newBlockedDate || blockedDates.includes(newBlockedDate)) return;
    setBlockedDates(prev => [...prev, newBlockedDate].sort());
    setNewBlockedDate('');
  };

  const removeBlockedDate = (date: string) => {
    setBlockedDates(prev => prev.filter(d => d !== date));
  };

  // ── Save availability ──
  const saveAvailability = useCallback(async () => {
    if (!user?.businessId) return;
    setSavingAvail(true);
    try {
      const res = await fetch('/api/store/bookings/availability', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: user.businessId,
          weeklySchedule: schedule,
          slotDuration,
          bufferTime,
          blockedDates,
        }),
      });
      if (!res.ok) throw new Error();
      showToast('Availability saved', 'success');
    } catch {
      showToast('Failed to save availability', 'error');
    } finally { setSavingAvail(false); }
  }, [user?.businessId, schedule, slotDuration, bufferTime, blockedDates, showToast]);

  // ── Stats ──
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'confirmed').length;

  return (
    <>
      <div className={styles.page}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.heading}>Bookings</h2>
            <p className={styles.sub}>Manage your booking availability and incoming appointments.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'bookings' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            Bookings {pendingCount > 0 && `(${pendingCount})`}
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'availability' ? styles.tabActive : ''}`}
            onClick={() => setActiveTab('availability')}
          >
            Availability
          </button>
        </div>

        {/* ─── Bookings Tab ─── */}
        {activeTab === 'bookings' && (
          <>
            {/* Stat strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
              <div style={{ background: 'var(--sell-surface)', border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius)', padding: '14px 16px', boxShadow: 'var(--sell-shadow-sm)' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--sell-text-3)', marginBottom: 6 }}>Pending</p>
                <p style={{ fontFamily: 'var(--sell-font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--sell-text-1)', lineHeight: 1 }}>{pendingCount}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--sell-text-3)', marginTop: 4 }}>Needs action</p>
              </div>
              <div style={{ background: 'var(--sell-surface)', border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius)', padding: '14px 16px', boxShadow: 'var(--sell-shadow-sm)' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--sell-text-3)', marginBottom: 6 }}>Confirmed</p>
                <p style={{ fontFamily: 'var(--sell-font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--sell-text-1)', lineHeight: 1 }}>{confirmedCount}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--sell-text-3)', marginTop: 4 }}>Upcoming</p>
              </div>
              <div style={{ background: 'var(--sell-surface)', border: '1px solid var(--sell-border)', borderRadius: 'var(--sell-radius)', padding: '14px 16px', boxShadow: 'var(--sell-shadow-sm)' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--sell-text-3)', marginBottom: 6 }}>Total</p>
                <p style={{ fontFamily: 'var(--sell-font-display)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--sell-text-1)', lineHeight: 1 }}>{bookings.length}</p>
                <p style={{ fontSize: '0.72rem', color: 'var(--sell-text-3)', marginTop: 4 }}>All time</p>
              </div>
            </div>

            {/* Filter chips */}
            <div className={styles.filterRow}>
              {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map(f => (
                <button
                  key={f}
                  className={`${styles.chip} ${statusFilter === f ? styles.chipActive : ''}`}
                  onClick={() => setStatusFilter(f)}
                >
                  {f === 'all' ? 'All' : STATUS_LABELS[f]} ({filterCounts[f]})
                </button>
              ))}
              <span className={styles.countPill}>{filtered.length} booking{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {/* Table */}
            <div className={styles.tableWrap}>
              {loadingBookings ? (
                <div className={styles.empty}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--sell-text-3)', fontSize: '0.875rem' }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.spinner}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                    Loading bookings…
                  </div>
                </div>
              ) : filtered.length === 0 ? (
                <div className={styles.empty}>
                  <div className={styles.emptyIcon}>📅</div>
                  <p className={styles.emptyTitle}>{bookings.length === 0 ? 'No bookings yet' : 'No results'}</p>
                  <p className={styles.emptySub}>
                    {bookings.length === 0
                      ? 'Incoming bookings will appear here when customers book your services.'
                      : 'Try clearing your filters.'}
                  </p>
                </div>
              ) : (
                <table className={styles.table}>
                  <thead><tr>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th style={{ width: 100 }}>Actions</th>
                  </tr></thead>
                  <tbody>
                    {filtered.map(b => (
                      <tr key={b.id}>
                        <td>
                          <p className={styles.customerName}>{b.customerName}</p>
                          <p className={styles.customerEmail}>{b.customerEmail}</p>
                        </td>
                        <td><span className={styles.serviceName}>{b.serviceName}</span></td>
                        <td><span className={styles.dateText}>{fmtDate(b.bookingDate)}</span></td>
                        <td><span className={styles.dateText}>{b.bookingTime}</span></td>
                        <td>
                          <span className={`${styles.badge} ${statusBadgeClass(b.status)}`}>
                            <span className={styles.badgeDot} />{STATUS_LABELS[b.status]}
                          </span>
                        </td>
                        <td>
                          <div className={styles.rowActions}>
                            <button className={styles.iconBtn} onClick={() => setSelectedBooking(b)} title="View details">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            </button>
                            {b.status === 'pending' && (
                              <>
                                <button className={`${styles.iconBtn} ${styles.iconBtnSuccess}`} onClick={() => handleStatusChange(b.id, 'confirmed')} title="Confirm">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                                </button>
                                <button className={`${styles.iconBtn} ${styles.iconBtnDanger}`} onClick={() => handleStatusChange(b.id, 'cancelled')} title="Cancel">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                                </button>
                              </>
                            )}
                            {b.status === 'confirmed' && (
                              <button className={`${styles.iconBtn} ${styles.iconBtnPrimary}`} onClick={() => handleStatusChange(b.id, 'completed')} title="Complete">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ─── Availability Tab ─── */}
        {activeTab === 'availability' && (
          <>
            {loadingAvail ? (
              <div className={styles.empty}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--sell-text-3)', fontSize: '0.875rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.spinner}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                  Loading availability…
                </div>
              </div>
            ) : (
              <>
                {/* Slot duration & buffer */}
                <div className={styles.settingsRow}>
                  <div className={styles.settingCard}>
                    <p className={styles.settingLabel}>Slot Duration</p>
                    <select className={styles.settingSelect} value={slotDuration} onChange={e => setSlotDuration(Number(e.target.value))}>
                      <option value={30}>30 minutes</option>
                      <option value={45}>45 minutes</option>
                      <option value={60}>60 minutes</option>
                      <option value={90}>90 minutes</option>
                      <option value={120}>120 minutes</option>
                    </select>
                  </div>
                  <div className={styles.settingCard}>
                    <p className={styles.settingLabel}>Buffer Time</p>
                    <select className={styles.settingSelect} value={bufferTime} onChange={e => setBufferTime(Number(e.target.value))}>
                      <option value={0}>None</option>
                      <option value={5}>5 minutes</option>
                      <option value={10}>10 minutes</option>
                      <option value={15}>15 minutes</option>
                      <option value={30}>30 minutes</option>
                    </select>
                  </div>
                </div>

                {/* Weekly schedule */}
                <div className={styles.availGrid}>
                  {schedule.map((day, i) => (
                    <div key={day.day} className={`${styles.dayCard} ${!day.enabled ? styles.dayDisabled : ''}`}>
                      <div className={styles.dayHeader}>
                        <span className={styles.dayLabel}>{day.day}</span>
                        <button
                          className={`${styles.toggle} ${day.enabled ? styles.toggleOn : ''}`}
                          onClick={() => toggleDay(i)}
                          type="button"
                        />
                      </div>
                      {day.enabled && (
                        <div className={styles.timeRow}>
                          <input
                            className={styles.timeInput}
                            type="time"
                            value={day.startTime}
                            onChange={e => updateTime(i, 'startTime', e.target.value)}
                          />
                          <span className={styles.timeSep}>to</span>
                          <input
                            className={styles.timeInput}
                            type="time"
                            value={day.endTime}
                            onChange={e => updateTime(i, 'endTime', e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Blocked dates */}
                <div className={styles.blockedDates}>
                  <p className={styles.blockedTitle}>Blocked Dates</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--sell-text-3)', marginBottom: 12 }}>
                    Add dates when you are unavailable (holidays, breaks, etc.)
                  </p>
                  <div className={styles.blockedInputRow}>
                    <input
                      className={styles.blockedInput}
                      type="date"
                      value={newBlockedDate}
                      onChange={e => setNewBlockedDate(e.target.value)}
                    />
                    <button
                      className={styles.addDateBtn}
                      onClick={addBlockedDate}
                      disabled={!newBlockedDate || blockedDates.includes(newBlockedDate)}
                    >
                      Block date
                    </button>
                  </div>
                  {blockedDates.length > 0 && (
                    <div className={styles.blockedChipList}>
                      {blockedDates.map(date => (
                        <span key={date} className={styles.blockedChip}>
                          {fmtDate(date)}
                          <button className={styles.blockedChipRemove} onClick={() => removeBlockedDate(date)} title="Remove">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Save button */}
                <button className={styles.saveBtn} onClick={saveAvailability} disabled={savingAvail}>
                  {savingAvail ? (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={styles.spinner}><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
                      Saving…
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      Save availability
                    </>
                  )}
                </button>
              </>
            )}
          </>
        )}
      </div>

      {/* Booking detail slide-over */}
      {selectedBooking && (
        <BookingSlideOver
          booking={selectedBooking}
          onClose={() => setSelectedBooking(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </>
  );
}
