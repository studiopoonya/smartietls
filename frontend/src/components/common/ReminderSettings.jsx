import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff, Check } from 'lucide-react';
import api from '../../lib/axios';
import { useAppStore } from '../../store/useAppStore';
import { toast } from './Toast';

export function browserTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

const ZONE_NAMES = { 'Asia/Jakarta': 'WIB', 'Asia/Pontianak': 'WIB', 'Asia/Makassar': 'WITA', 'Asia/Jayapura': 'WIT' };

/** Turns the daily reminder email on or off and sets its time, without restarting the study plan. */
export default function ReminderSettings({ plan }) {
  const queryClient = useQueryClient();
  const email = useAppStore(s => s.user?.email);
  const [time, setTime] = useState(plan.reminder_time ?? '08:00');
  const [saved, setSaved] = useState(false);
  const enabled = !!plan.reminder_enabled;
  const zone = browserTimezone() ?? plan.timezone;

  const save = useMutation({
    mutationFn: (body) => api.put('/study-plan/reminder', { timezone: browserTimezone(), ...body }).then(r => r.data),
    onSuccess: (data) => {
      queryClient.setQueryData(['study-plan'], old => (old ? { ...old, ...data } : old));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
    onError: (err) => toast(err.response?.data?.message ?? 'Could not save your reminder. Please try again.', 'error'),
  });

  const timeChanged = time !== plan.reminder_time;

  return (
    <section aria-label="Daily reminder" style={{ marginBottom: 20, padding: '14px 18px', borderRadius: 14, background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: enabled ? 'color-mix(in srgb, var(--accent-primary) 14%, transparent)' : 'var(--bg-elevated)' }}>
            {enabled ? <Bell size={17} style={{ color: 'var(--accent-primary)' }} /> : <BellOff size={17} style={{ color: 'var(--text-muted)' }} />}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Daily reminder</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', overflowWrap: 'anywhere' }}>
              {enabled ? `Email to ${email ?? 'you'} every day at ${plan.reminder_time}${ZONE_NAMES[zone] ? ` ${ZONE_NAMES[zone]}` : ''}` : 'Off. Turn it on to get a daily nudge by email.'}
            </div>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label="Email reminders"
          data-compact
          disabled={save.isPending}
          onClick={() => save.mutate({ reminder_enabled: !enabled, reminder_time: time })}
          style={{ width: 44, height: 26, borderRadius: 99, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0, background: enabled ? 'var(--accent-primary)' : 'var(--border)', transition: 'background 0.2s' }}
        >
          <span style={{ position: 'absolute', top: 3, left: enabled ? 21 : 3, width: 20, height: 20, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.25)' }} />
        </button>
      </div>

      {enabled && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
          <label htmlFor="reminder-time" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Time</label>
          <input id="reminder-time" type="time" className="input-dark" value={time} onChange={e => setTime(e.target.value)} style={{ width: 130, padding: '8px 10px' }} />
          {timeChanged && (
            <button type="button" className="btn-primary" data-compact disabled={save.isPending || !time} onClick={() => save.mutate({ reminder_enabled: true, reminder_time: time })} style={{ padding: '8px 16px', fontSize: 13 }}>
              {save.isPending ? 'Saving…' : 'Save'}
            </button>
          )}
          {saved && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 13, color: 'var(--accent-success)' }}><Check size={14} /> Saved</span>}
        </div>
      )}
    </section>
  );
}
