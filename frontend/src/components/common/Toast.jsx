import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';

const icons = { success: CheckCircle, error: XCircle, warning: AlertCircle };
const colors = { success: 'var(--accent-success)', error: 'var(--accent-danger)', warning: 'var(--accent-warning)' };

export function Toast({ message, type = 'success', onClose }) {
  const Icon = icons[type] ?? CheckCircle;

  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
      style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'var(--bg-elevated)', border: `1px solid ${colors[type]}40`, borderRadius: 12, padding: '14px 18px', boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${colors[type]}20`, maxWidth: 380, cursor: 'pointer' }}
      onClick={onClose}>
      <Icon size={18} style={{ color: colors[type], flexShrink: 0 }} />
      <span style={{ fontSize: 14, color: 'var(--text-primary)', flex: 1 }}>{message}</span>
      <X size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
    </motion.div>
  );
}

let _toastFn = null;
export function setToastFn(fn) { _toastFn = fn; }
export function toast(message, type = 'success') { _toastFn?.(message, type); }

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    setToastFn((message, type) => {
      const id = Date.now();
      setToasts(prev => [...prev, { id, message, type }]);
    });
  }, []);

  return (
    <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <AnimatePresence>
        {toasts.map(t => (
          <Toast key={t.id} message={t.message} type={t.type} onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
        ))}
      </AnimatePresence>
    </div>
  );
}
