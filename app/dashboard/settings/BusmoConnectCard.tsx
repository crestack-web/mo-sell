'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase-client';
import styles from './SellSettingsPage.module.css';

type Props = {
  businessId?: string;
  showToast?: (msg: string) => void;
};

export function BusmoConnectCard({ businessId, showToast }: Props) {
  const [configured, setConfigured] = useState(false);
  const [linked, setLinked] = useState<{ busmoBusinessId: string | null } | null>(null);
  const [candidates, setCandidates] = useState<Array<{ id: string; name: string; category?: string | null }>>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const { data: { session } } = await supabaseClient.auth.getSession();
        const token = session?.access_token;
        if (!token) return;
        const res = await fetch(`/api/integrations/busmo?businessId=${encodeURIComponent(businessId)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        setConfigured(!!json.configured);
        setLinked(json.linked || null);
        setCandidates(Array.isArray(json.candidates) ? json.candidates : []);

        if (typeof window !== 'undefined') {
          const params = new URLSearchParams(window.location.search);
          const fromBusmo = params.get('connectFromBusmo') === '1';
          const bid = params.get('busmoBusinessId');
          if (fromBusmo && bid && !json.linked?.busmoBusinessId) {
            const linkRes = await fetch('/api/integrations/busmo', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                action: 'link',
                businessId,
                busmoBusinessId: bid,
                fromBusmo: true,
              }),
            });
            const linkJson = await linkRes.json().catch(() => ({}));
            if (linkRes.ok) {
              setLinked(linkJson.linked || { busmoBusinessId: bid });
              if (linkJson.busmoReverseLinked === false) {
                setMsg(
                  linkJson.warning ||
                    'Linked on Mo-sell, but Busmo was not updated. Return to Busmo and click Refresh, or check server Busmo env keys.'
                );
              } else {
                setMsg('Connected to Busmo successfully. You can return to Busmo — activity will update there.');
              }
              const url = new URL(window.location.href);
              url.searchParams.delete('connectFromBusmo');
              url.searchParams.delete('busmoBusinessId');
              window.history.replaceState({}, '', url.pathname + url.search);
            } else {
              setMsg(linkJson.error || 'Could not connect from Busmo');
            }
          }
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [businessId]);

  async function authHeaders() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error('Not signed in');
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <p className={styles.cardTitle}>Busmo inventory</p>
          <p className={styles.cardSub}>
            Connect your Busmo business to import physical products and send online sales back to Busmo stock.
          </p>
        </div>
      </div>
      <div className={styles.cardBody} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {loading ? (
          <p className={styles.formHint}>Checking connection…</p>
        ) : !configured ? (
          <p className={styles.formHint}>
            Busmo integration is not configured on the server yet. Set{' '}
            <code>BUSMO_SUPABASE_URL</code> and <code>BUSMO_SUPABASE_SERVICE_ROLE_KEY</code> on Vercel.
          </p>
        ) : linked?.busmoBusinessId ? (
          <>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>
              Connected to Busmo business{' '}
              <strong style={{ fontFamily: 'monospace' }}>{linked.busmoBusinessId}</strong>
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnPrimary}`}
                disabled={importing || !businessId}
                onClick={async () => {
                  if (!businessId) return;
                  setImporting(true);
                  setMsg(null);
                  try {
                    const headers = await authHeaders();
                    const res = await fetch('/api/integrations/busmo', {
                      method: 'POST',
                      headers,
                      body: JSON.stringify({ action: 'import-products', businessId }),
                    });
                    const json = await res.json().catch(() => ({}));
                    if (!res.ok) throw new Error(json.error || 'Import failed');
                    setMsg(`Imported ${json.imported} new, updated ${json.updated} (from ${json.total} Busmo products)`);
                    showToast?.('Products imported from Busmo');
                  } catch (e: any) {
                    setMsg(e?.message || 'Import failed');
                  } finally {
                    setImporting(false);
                  }
                }}
              >
                {importing ? 'Importing…' : 'Import physical products'}
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btnGhost}`}
                onClick={async () => {
                  if (!businessId) return;
                  if (!confirm('Disconnect Busmo? Online sales will stop updating Busmo stock.')) return;
                  try {
                    const headers = await authHeaders();
                    await fetch('/api/integrations/busmo', {
                      method: 'POST',
                      headers,
                      body: JSON.stringify({ action: 'unlink', businessId }),
                    });
                    setLinked({ busmoBusinessId: null });
                    setMsg('Disconnected from Busmo');
                  } catch {
                    setMsg('Could not disconnect');
                  }
                }}
              >
                Disconnect
              </button>
            </div>
          </>
        ) : (
          <>
            <p className={styles.formHint} style={{ margin: 0 }}>
              We look up Busmo businesses that use the same email as this account.
            </p>
            {candidates.length === 0 ? (
              <p className={styles.formHint}>
                No Busmo business found for your email. In Busmo open Settings → connect Mo-sell, or use the same email on both apps.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {candidates.map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{c.name}</div>
                      <div className={styles.formHint} style={{ margin: 0 }}>{c.category || 'Business'} · {c.id}</div>
                    </div>
                    <button
                      type="button"
                      className={`${styles.btn} ${styles.btnPrimary}`}
                      onClick={async () => {
                        if (!businessId) return;
                        setMsg(null);
                        try {
                          const headers = await authHeaders();
                          const res = await fetch('/api/integrations/busmo', {
                            method: 'POST',
                            headers,
                            body: JSON.stringify({
                              action: 'link',
                              businessId,
                              busmoBusinessId: c.id,
                            }),
                          });
                          const json = await res.json().catch(() => ({}));
                          if (!res.ok) throw new Error(json.error || 'Link failed');
                          setLinked(json.linked || { busmoBusinessId: c.id });
                          if (json.busmoReverseLinked === false) {
                            setMsg(json.warning || 'Connected on Mo-sell; Busmo reverse link incomplete');
                          } else {
                            setMsg('Connected to Busmo');
                            showToast?.('Connected to Busmo');
                          }
                        } catch (e: any) {
                          setMsg(e?.message || 'Link failed');
                        }
                      }}
                    >
                      Connect
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
        {msg && <p className={styles.formHint} style={{ margin: 0 }}>{msg}</p>}
      </div>
    </div>
  );
}
