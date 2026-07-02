import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, ExternalLink, ShieldCheck, Flame } from 'lucide-react';
import { useAdminUsers } from '../../hooks/useAdmin';
import { useIsMobile } from '../../hooks/useIsMobile';

function formatDate(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState('created_at');
  const [dir, setDir] = useState('desc');

  useEffect(() => {
    setPage(1);
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const { data, isLoading } = useAdminUsers({ search: debouncedSearch || undefined, page, sort, dir });

  const users = data?.data ?? [];
  const meta = data?.meta ?? {};

  function toggleSort(col) {
    if (sort === col) setDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSort(col); setDir('desc'); }
    setPage(1);
  }

  function SortHeader({ col, label }) {
    const active = sort === col;
    return (
      <th onClick={() => toggleSort(col)}
        style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: active ? 'var(--accent-glow)' : 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', cursor: 'pointer', whiteSpace: 'nowrap', userSelect: 'none' }}>
        {label} {active ? (dir === 'desc' ? '↓' : '↑') : ''}
      </th>
    );
  }

  return (
    <div style={{ padding: isMobile ? '20px 16px' : '32px 36px', maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between', marginBottom: isMobile ? 18 : 24, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 14 : 0 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontFamily: 'Space Grotesk', marginBottom: 4 }}>Users</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {meta.total != null ? `${meta.total} total registered users` : 'All registered users'}
          </p>
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            className="input-dark"
            placeholder="Search name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ paddingLeft: 34, width: isMobile ? '100%' : 240, fontSize: 13 }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="glow-card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 24 }}>
            {[...Array(6)].map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 52, marginBottom: 8, borderRadius: 8 }} />
            ))}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                  <SortHeader col="name"            label="User" />
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Band</th>
                  <SortHeader col="streak_days"     label="Streak" />
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Sessions</th>
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Vocab</th>
                  <SortHeader col="last_active_date" label="Last Active" />
                  <SortHeader col="created_at"      label="Joined" />
                  <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Role</th>
                  <th style={{ padding: '10px 12px' }} />
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(124,58,237,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    onClick={() => navigate(`/admin/users/${u.id}`)}>
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-glow))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                          {u.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{u.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 12px', fontFamily: 'Space Mono', fontSize: 13, fontWeight: 700, color: 'var(--accent-glow)' }}>{u.target_band}</td>
                    <td style={{ padding: '14px 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: 'Space Mono', fontSize: 13, fontWeight: 700, color: u.streak_days > 0 ? '#F59E0B' : 'var(--text-muted)' }}>
                        {u.streak_days > 0 && <Flame size={12} style={{ color: '#F59E0B' }} />}
                        {u.streak_days}d
                      </div>
                    </td>
                    <td style={{ padding: '14px 12px', fontFamily: 'Space Mono', fontSize: 13, color: 'var(--text-secondary)' }}>{u.learning_sessions_count}</td>
                    <td style={{ padding: '14px 12px', fontFamily: 'Space Mono', fontSize: 13, color: 'var(--text-secondary)' }}>{u.vocabularies_count}</td>
                    <td style={{ padding: '14px 12px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(u.last_active_date)}</td>
                    <td style={{ padding: '14px 12px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(u.created_at)}</td>
                    <td style={{ padding: '14px 12px' }}>
                      {u.is_admin ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700, color: 'var(--accent-primary)', background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 5, padding: '2px 7px' }}>
                          <ShieldCheck size={10} />ADMIN
                        </span>
                      ) : (
                        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>User</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 12px' }}>
                      <ExternalLink size={13} style={{ color: 'var(--text-muted)' }} />
                    </td>
                  </motion.tr>
                ))}
                {!users.length && (
                  <tr>
                    <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                      {debouncedSearch ? `No users matching "${debouncedSearch}"` : 'No users found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta.last_page > 1 && (
          <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between', padding: isMobile ? '14px 16px' : '14px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 10 : 0 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Page {meta.current_page} of {meta.last_page} · {meta.total} users
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={meta.current_page <= 1}
                className="btn-secondary" style={{ padding: '6px 10px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                <ChevronLeft size={14} /> Prev
              </button>
              <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={meta.current_page >= meta.last_page}
                className="btn-secondary" style={{ padding: '6px 10px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
