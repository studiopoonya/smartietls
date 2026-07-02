import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useRegister } from '../../hooks/useAuth';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', password_confirmation: '' });
  const [showPass, setShowPass] = useState(false);
  const { mutate: register, isPending, error } = useRegister();

  const handleSubmit = (e) => {
    e.preventDefault();
    register(form);
  };

  const errors = error?.response?.data?.errors ?? {};
  const generalError = error?.response?.data?.message;

  const field = (key, label, type, icon, placeholder) => (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>{label}</label>
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', display: 'flex' }}>{icon}</span>
        <input className="input-dark" type={type} placeholder={placeholder} value={form[key]}
          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          style={{ paddingLeft: 42 }} required />
      </div>
      {errors[key] && <div style={{ fontSize: 12, color: 'var(--accent-danger)', marginTop: 6 }}>{errors[key][0]}</div>}
    </div>
  );

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <h1 style={{ fontSize: 32, marginBottom: 8 }}>Create account</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Start your IELTS prep journey</p>
      </div>

      <div className="glow-card" style={{ padding: 32 }}>
        {generalError && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 14, color: 'var(--accent-danger)' }}>
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {field('name', 'Full name', 'text', <User size={16} />, 'Your name')}
          {field('email', 'Email', 'email', <Mail size={16} />, 'you@example.com')}

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input-dark" type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                style={{ paddingLeft: 42, paddingRight: 42 }} required />
              <button type="button" onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <div style={{ fontSize: 12, color: 'var(--accent-danger)', marginTop: 6 }}>{errors.password[0]}</div>}
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>Confirm password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input className="input-dark" type={showPass ? 'text' : 'password'} placeholder="Repeat password" value={form.password_confirmation}
                onChange={e => setForm(p => ({ ...p, password_confirmation: e.target.value }))}
                style={{ paddingLeft: 42 }} required />
            </div>
          </div>

          <button className="btn-primary" type="submit" disabled={isPending} style={{ width: '100%', padding: '13px', fontSize: 15 }}>
            {isPending ? 'Creating account...' : 'Create account'}
          </button>
        </form>
      </div>

      <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-secondary)', fontSize: 14 }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--accent-glow)', textDecoration: 'none', fontWeight: 600 }}>Log in</Link>
      </p>
    </div>
  );
}
