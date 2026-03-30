import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminLogin = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(''); setLoading(true);
        try {
            const data = await login(form.email, form.password);
            if (data.role !== 'admin') {
                setError('Access denied. Admin account required.');
                return;
            }
            navigate('/admin');
        } catch (err) {
            setError(err.message);
        } finally { setLoading(false); }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: '#0f172a' }}>
            <Helmet>
                <title>Admin Sign In | NovaCart</title>
                <meta name="robots" content="noindex, nofollow" />
            </Helmet>

            {/* Left Panel */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #059669, #0d9488)', padding: '40px' }}>
                <div style={{ textAlign: 'center', color: '#fff' }}>
                    <i className="fa-solid fa-gauge-high" style={{ fontSize: '4rem', marginBottom: '20px', opacity: 0.9 }}></i>
                    <h2 style={{ fontSize: '2rem', fontWeight: '800', marginBottom: '10px' }}>NovaAdmin</h2>
                    <p style={{ opacity: 0.8, fontSize: '1.05rem' }}>Manage your store from one place</p>
                </div>
            </div>

            {/* Right Form Panel */}
            <div style={{ width: '420px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
                <div style={{ width: '100%' }}>
                    <h2 style={{ color: '#f1f5f9', fontSize: '1.7rem', fontWeight: '700', marginBottom: '8px' }}>Admin Sign In</h2>
                    <p style={{ color: '#64748b', marginBottom: '30px' }}>Enter your admin credentials to continue</p>

                    {error && <div style={{ background: '#3f1212', border: '1px solid #ef4444', color: '#fca5a5', padding: '10px 14px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>{error}</div>}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div>
                            <label style={{ display: 'block', color: '#94a3b8', fontWeight: '600', marginBottom: '6px', fontSize: '0.85rem' }}>Email Address</label>
                            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="admin@novacart.com" required
                                style={{ width: '100%', padding: '12px 14px', background: '#1e293b', border: '1.5px solid #334155', borderRadius: '10px', color: '#f1f5f9', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', color: '#94a3b8', fontWeight: '600', marginBottom: '6px', fontSize: '0.85rem' }}>Password</label>
                            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required
                                style={{ width: '100%', padding: '12px 14px', background: '#1e293b', border: '1.5px solid #334155', borderRadius: '10px', color: '#f1f5f9', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }} />
                        </div>
                        <button type="submit" disabled={loading} style={{ padding: '13px', background: loading ? '#475569' : 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '6px' }}>
                            {loading ? 'Signing In...' : 'Sign In to Dashboard'}
                        </button>
                    </form>
                    <a href="/" style={{ display: 'block', textAlign: 'center', marginTop: '20px', color: '#475569', fontSize: '0.85rem', textDecoration: 'none' }}>← Back to Store</a>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
