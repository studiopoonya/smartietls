import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Shield, ShieldOff, Trash2, Pencil, Flame, BookMarked, Layers, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAdminUser, useToggleAdmin, useDeleteUser, useUpdateUser } from '../../hooks/useAdmin';
import { getBandColor, formatDate } from '../../lib/utils';
import BandScoreBar from '../../components/common/BandScoreBar';
import { useIsMobile } from '../../hooks/useIsMobile';

const MODULE_COLORS = {
  writing: '#7C3AED', speaking: '#06B6D4', reading: '#10B981',
  listening: '#F59E0B', mock_test: '#EF4444',
};

export default function AdminUserDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data, isLoading } = useAdminUser(id);
  const toggleAdmin = useToggleAdmin();
  const deleteUser = useDeleteUser();
  const updateUser = useUpdateUser();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', email: '', target_band: 7 });
  const [editError, setEditError] = useState('');
  const [actionMsg, setActionMsg] = useState('');

  if (isLoading) {
    return (
      <div style={{ padding: isMobile ? '20px 16px' : '32px 36px' }}>
        <div className="skeleton" style={{ height: 32, width: 140, borderRadius: 8, marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 120, borderRadius: 12, marginBottom: 20 }} />
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 14 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12 }} />)}
        </div>
      </div>
    );
  }

  const { user, recent_sessions, latest_snapshot } = data ?? {};

  async function handleToggleAdmin() {
    const result = await toggleAdmin.mutateAsync(id);
    setActionMsg(result.message);
    setTimeout(() => setActionMsg(''), 3000);
  }

  async function handleDelete() {
    await deleteUser.mutateAsync(id);
    navigate('/admin/users');
  }

  function openEdit() {
    setEditForm({ name: user?.name ?? '', email: user?.email ?? '', target_band: user?.target_band ?? 7 });
    setEditError('');
    setEditing(true);
  }

  async function handleSaveEdit() {
    setEditError('');
    try {
      await updateUser.mutateAsync({ id, ...editForm });
      setEditing(false);
      setActionMsg('User updated successfully');
      setTimeout(() => setActionMsg(''), 3000);
    } catch (e) {
      setEditError(e.response?.data?.message || 'Failed to update user');
    }
  }

  return (
    <div style={{ padding: isMobile ? '20px 16px' : '32px 36px', maxWidth: 1000 }}>
      {/* Back + action message */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: isMobile ? 18 : 24, flexWrap: 'wrap', gap: 10 }}>
        <button onClick={() => navigate('/admin/users')}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, padding: 0 }}>
          <ArrowLeft size={15} /> Back to Users
        </button>
        <AnimatePresence>
          {actionMsg && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ fontSize: 12, color: 'var(--accent-success)', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '6px 12px' }}>
              {actionMsg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User header */}
      <motion.div className="glow-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        style={{ padding: isMobile ? '20px 18px' : '24px 28px', marginBottom: 20, display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 14 : 18 }}>
          <div style={{ width: isMobile ? 46 : 54, height: isMobile ? 46 : 54, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-glow))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? 17 : 20, fontWeight: 700, color: 'white', flexShrink: 0, boxShadow: '0 0 20px rgba(124,58,237,0.4)' }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: isMobile ? 17 : 20, fontFamily: 'Space Grotesk', fontWeight: 700 }}>{user?.name}</h2>
              {user?.is_admin && (
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-primary)', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 5, padding: '2px 7px' }}>ADMIN</span>
              )}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', overflowWrap: 'break-word' }}>{user?.email}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              Member since {formatDate(user?.created_at)} · Band goal: <span style={{ color: 'var(--accent-glow)', fontFamily: 'Space Mono', fontWeight: 700 }}>{user?.target_band}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={openEdit}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-elevated)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s', flex: isMobile ? 1 : 'unset', justifyContent: 'center' }}>
            <Pencil size={14} /> Edit
          </button>
          <button onClick={handleToggleAdmin} disabled={toggleAdmin.isPending}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 8, border: '1px solid rgba(124,58,237,0.35)', background: 'rgba(124,58,237,0.1)', color: 'var(--accent-glow)', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s', flex: isMobile ? 1 : 'unset', justifyContent: 'center' }}>
            {user?.is_admin ? <ShieldOff size={14} /> : <Shield size={14} />}
            {user?.is_admin ? 'Revoke Admin' : 'Grant Admin'}
          </button>
          <button onClick={() => setConfirmDelete(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 8, border: '1px solid rgba(239,68,68,0.35)', background: 'rgba(239,68,68,0.08)', color: 'var(--accent-danger)', cursor: 'pointer', fontSize: 13, fontWeight: 600, transition: 'all 0.2s', flex: isMobile ? 1 : 'unset', justifyContent: 'center' }}>
            <Trash2 size={14} /> Delete User
          </button>
        </div>
      </motion.div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 14, marginBottom: 20 }}>
        {[
          { icon: Layers,    label: 'Sessions',   value: user?.session_count ?? 0,  color: '#7C3AED' },
          { icon: BookMarked,label: 'Vocab Words', value: user?.vocab_count ?? 0,    color: '#06B6D4' },
          { icon: Flame,     label: 'Streak',      value: `${user?.streak_days ?? 0}d`, color: '#F59E0B' },
          { icon: TrendingUp,label: 'Overall Band', value: latest_snapshot?.overall_band ?? '—', color: '#10B981', mono: true },
        ].map((s, i) => (
          <motion.div key={s.label} className="glow-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            style={{ padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
              <s.icon size={14} style={{ color: s.color }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</span>
            </div>
            <div style={{ fontFamily: s.mono ? 'Space Mono' : 'Space Grotesk', fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap: isMobile ? 16 : 20, marginBottom: 20 }}>
        {/* Recent sessions */}
        <motion.div className="glow-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <h3 style={{ fontSize: 14, fontFamily: 'Space Grotesk', fontWeight: 700 }}>Recent Sessions</h3>
            <button onClick={() => navigate(`/admin/users/${id}/progress`)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--accent-glow)', cursor: 'pointer', fontSize: 12, fontWeight: 600, padding: 0 }}>
              <TrendingUp size={13} /> View Full Progress
            </button>
          </div>
          {recent_sessions?.length ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                    {['Module', 'Band', 'Duration', 'Date'].map(h => (
                      <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent_sessions.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 8, height: 8, borderRadius: '50%', background: MODULE_COLORS[s.module] ?? 'var(--border)', flexShrink: 0 }} />
                          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{s.module.replace('_', ' ')}</span>
                        </div>
                      </td>
                      <td style={{ padding: '11px 14px', fontFamily: 'Space Mono', fontSize: 13, fontWeight: 700, color: getBandColor(s.band_score) }}>{s.band_score ?? '—'}</td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
                        {s.duration_seconds ? `${Math.round(s.duration_seconds / 60)}m` : '—'}
                      </td>
                      <td style={{ padding: '11px 14px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(s.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No sessions yet</div>
          )}
        </motion.div>

        {/* Band scores */}
        <motion.div className="glow-card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          style={{ padding: '18px 20px' }}>
          <h3 style={{ fontSize: 14, fontFamily: 'Space Grotesk', fontWeight: 700, marginBottom: 16 }}>Band Scores</h3>
          {latest_snapshot ? (
            <>
              <div style={{ textAlign: 'center', padding: '10px', background: 'var(--bg-elevated)', borderRadius: 10, marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>OVERALL</div>
                <div style={{ fontFamily: 'Space Mono', fontSize: 36, fontWeight: 700, color: getBandColor(latest_snapshot.overall_band) }}>{latest_snapshot.overall_band}</div>
              </div>
              <BandScoreBar label="Writing"   score={latest_snapshot.writing_band} />
              <BandScoreBar label="Speaking"  score={latest_snapshot.speaking_band} />
              <BandScoreBar label="Reading"   score={latest_snapshot.reading_band} />
              <BandScoreBar label="Listening" score={latest_snapshot.listening_band} />
            </>
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '24px 0' }}>
              <TrendingUp size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
              No scores yet
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete confirmation overlay */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
            onClick={() => setConfirmDelete(false)}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: isMobile ? '26px 22px' : '32px 36px', maxWidth: 400, width: '90%', textAlign: 'center' }}>
              <div style={{ width: 52, height: 52, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
                <AlertTriangle size={22} style={{ color: 'var(--accent-danger)' }} />
              </div>
              <h3 style={{ fontSize: 18, fontFamily: 'Space Grotesk', marginBottom: 10 }}>Delete User?</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24, lineHeight: 1.6 }}>
                This will permanently delete <strong>{user?.name}</strong> and all their sessions, vocabulary, and progress data. This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <button onClick={() => setConfirmDelete(false)} className="btn-secondary" style={{ padding: '10px 20px' }}>Cancel</button>
                <button onClick={handleDelete} disabled={deleteUser.isPending}
                  style={{ padding: '10px 20px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--accent-danger)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                  {deleteUser.isPending ? 'Deleting…' : 'Delete Permanently'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit user overlay */}
      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
            onClick={() => setEditing(false)}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: isMobile ? '24px 20px' : '28px 32px', maxWidth: 420, width: '90%' }}>
              <h3 style={{ fontSize: 17, fontFamily: 'Space Grotesk', marginBottom: 20 }}>Edit User</h3>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>Name</label>
                <input className="input-dark" value={editForm.name}
                  onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                  style={{ width: '100%' }} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6, fontWeight: 500 }}>Email</label>
                <input className="input-dark" type="email" value={editForm.email}
                  onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                  style={{ width: '100%' }} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>Target Band</label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[4, 5, 6, 7, 8, 9].map(b => (
                    <button key={b} onClick={() => setEditForm(f => ({ ...f, target_band: b }))}
                      style={{ padding: '7px 13px', borderRadius: 8, border: `1px solid ${editForm.target_band === b ? 'var(--accent-primary)' : 'var(--border)'}`, background: editForm.target_band === b ? 'rgba(124,58,237,0.2)' : 'var(--bg-elevated)', color: editForm.target_band === b ? 'var(--accent-glow)' : 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'Space Mono', fontSize: 13, fontWeight: 700 }}>
                      {b}
                    </button>
                  ))}
                </div>
              </div>

              {editError && (
                <div style={{ fontSize: 12, color: 'var(--accent-danger)', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '8px 12px', marginBottom: 16 }}>
                  {editError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setEditing(false)} className="btn-secondary" style={{ padding: '10px 18px' }}>Cancel</button>
                <button onClick={handleSaveEdit} disabled={updateUser.isPending} className="btn-primary" style={{ padding: '10px 18px' }}>
                  {updateUser.isPending ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
