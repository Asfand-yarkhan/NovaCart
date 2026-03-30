import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const from = location.state?.from?.pathname || '/';
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            await login(form.email, form.password);
            navigate(from, { replace: true });
        } catch (err) {
            setError(err.message);
        } finally { setLoading(false); }
    };

    return (
        <main style={{ minHeight: '100vh', marginTop: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>
            <Helmet>
                <title>Login | NovaCart</title>
                <meta name="description" content="Log in to your NovaCart account." />
            </Helmet>
            <div style={{ width: '100%', maxWidth: '420px', background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <i className="fa-solid fa-leaf" style={{ fontSize: '2.5rem', color: '#059669' }}></i>
                    <h2 style={{ marginTop: '10px', fontSize: '1.6rem', color: '#1e293b' }}>Welcome Back</h2>
                    <p style={{ color: '#64748b', marginTop: '5px' }}>Sign in to your NovaCart account</p>
                </div>
                {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 15px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>{error}</div>}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '6px', fontSize: '0.9rem' }}>Email Address</label>
                        <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required style={{ width: '100%', padding: '12px 15px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }} onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '6px', fontSize: '0.9rem' }}>Password</label>
                        <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required style={{ width: '100%', padding: '12px 15px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '1rem', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' }} onFocus={e => e.target.style.borderColor = '#059669'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                    </div>
                    <button type="submit" disabled={loading} style={{ padding: '14px', background: loading ? '#9ca3af' : 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '20px', color: '#64748b', fontSize: '0.9rem' }}>
                    Don't have an account? <Link to="/signup" style={{ color: '#059669', fontWeight: '700', textDecoration: 'none' }}>Create one free</Link>
                </p>
            </div>
        </main>
    );
};

export default Login;
