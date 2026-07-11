import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Key, CheckCircle, AlertCircle, ExternalLink, ArrowRight } from 'lucide-react';
import api from '../lib/axios';
import { useAppStore } from '../store/useAppStore';
import { useIsMobile } from '../hooks/useIsMobile';

export default function Setup() {
  const [apiKey, setApiKey] = useState('');
  const [examDate, setExamDate] = useState('');
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const updateUser = useAppStore(s => s.updateUser);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleTest = async () => {
    if (!apiKey.trim()) return;
    setTesting(true); setTestResult(null);
    try {
      const { data } = await api.post('/user/api-key/test', { api_key: apiKey });
      setTestResult({ ok: data.valid, msg: data.message });
    } catch {
      setTestResult({ ok: false, msg: 'Invalid key or connection error' });
    } finally { setTesting(false); }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    setSaving(true);
    try {
      await api.post('/user/api-key', { api_key: apiKey });
      if (examDate) await api.put('/user/profile', { exam_date: examDate });
      updateUser({ has_api_key: true });
      navigate('/admin');
    } catch (e) {
      setTestResult({ ok: false, msg: e.response?.data?.message || 'Failed to save API key' });
    } finally { setSaving(false); }
  };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: isMobile ? '32px 16px 80px' : '60px 24px' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 28 : 44 }}>
          <div style={{ width: 58, height: 58, borderRadius: 16, background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-glow))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 36px rgba(124,58,237,0.4)' }}>
            <Key size={24} color="white" />
          </div>
          <h1 style={{ fontSize: isMobile ? 26 : 34, marginBottom: 10 }}>Setup your AI Tutor</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: isMobile ? 14 : 16, lineHeight: 1.6 }}>
            Connect your Anthropic API key to unlock AI-powered IELTS coaching. Your key is encrypted and never shared.
          </p>
        </div>

        <div className="glow-card" style={{ padding: isMobile ? 20 : 32, marginBottom: 16 }}>
          <h3 style={{ fontSize: isMobile ? 15 : 16, marginBottom: 18, fontFamily: 'Space Grotesk' }}>Your Anthropic API Key</h3>

          <div style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 10, padding: '12px 14px', marginBottom: 18, fontSize: 13, color: 'var(--accent-secondary)', display: 'flex', gap: 10 }}>
            <ExternalLink size={15} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>Get your free API key at <strong>console.anthropic.com</strong> → API Keys</span>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>
              API Key <span style={{ color: 'var(--text-muted)' }}>(starts with sk-ant-)</span>
            </label>
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input className="input-dark" type="password" placeholder="sk-ant-api03-..." value={apiKey}
                  onChange={e => setApiKey(e.target.value)} />
                <button className="btn-secondary" onClick={handleTest} disabled={testing || !apiKey} style={{ padding: '10px', fontSize: 13 }}>
                  {testing ? 'Testing...' : 'Test API Key'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10 }}>
                <input className="input-dark" type="password" placeholder="sk-ant-api03-..." value={apiKey}
                  onChange={e => setApiKey(e.target.value)} style={{ flex: 1 }} />
                <button className="btn-secondary" onClick={handleTest} disabled={testing || !apiKey} style={{ whiteSpace: 'nowrap', padding: '10px 18px' }}>
                  {testing ? 'Testing...' : 'Test key'}
                </button>
              </div>
            )}
          </div>

          {testResult && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 10, marginBottom: 16, background: testResult.ok ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${testResult.ok ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
              {testResult.ok ? <CheckCircle size={16} style={{ color: 'var(--accent-success)', flexShrink: 0 }} /> : <AlertCircle size={16} style={{ color: 'var(--accent-danger)', flexShrink: 0 }} />}
              <span style={{ fontSize: 13, color: testResult.ok ? 'var(--accent-success)' : 'var(--accent-danger)' }}>{testResult.msg}</span>
            </motion.div>
          )}

          <div style={{ marginBottom: 22 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 500 }}>
              IELTS Exam Date <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
            </label>
            <input
              className="input-dark"
              type="date"
              value={examDate}
              onChange={e => setExamDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              style={{ fontSize: 14, colorScheme: 'dark' }}
            />
            {examDate && (
              <div style={{ fontSize: 12, color: 'var(--accent-secondary)', marginTop: 6 }}>
                {Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24))} days until your exam
              </div>
            )}
          </div>

          {testResult?.ok && (
            <div style={{ fontSize: 12, color: 'var(--accent-success)', textAlign: 'center', marginBottom: 10 }}>
              ✓ Key verified — click below to save and continue
            </div>
          )}
          <button className="btn-primary" onClick={handleSave} disabled={!apiKey || saving}
            style={{ width: '100%', padding: isMobile ? '15px' : '16px', fontSize: isMobile ? 16 : 17, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: testResult?.ok ? '0 0 24px rgba(124,58,237,0.5)' : 'none' }}>
            {saving ? 'Saving...' : <><span>Save API Key</span><ArrowRight size={18} /></>}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 10, fontSize: 13, color: 'var(--text-muted)' }}>
          <CheckCircle size={14} style={{ color: 'var(--accent-success)', flexShrink: 0 }} />
          Your API key is encrypted with AES-256 before being stored. Only you can use it.
        </div>
      </motion.div>
    </div>
  );
}
