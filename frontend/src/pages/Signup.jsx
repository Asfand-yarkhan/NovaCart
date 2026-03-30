import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Signup = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
        if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
        setLoading(true);
        try {
            await register(form.name, form.email, form.password);
            navigate('/');
        } catch (err) {
            setError(err.message);
        } finally { setLoading(false); }
    };

    const inputStyle = { width: '100%', padding: '12px 15px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' };

    return (
        <main style={{ minHeight: '100vh', marginTop: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)' }}>
            <Helmet>
                <title>Create Account | NovaCart</title>
                <meta name="description" content="Create a free NovaCart account to shop fresh groceries online." />
            </Helmet>
            <div style={{ width: '100%', maxWidth: '440px', background: '#fff', padding: '40px', borderRadius: '16px', boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <i className="fa-solid fa-leaf" style={{ fontSize: '2.5rem', color: '#059669' }}></i>
                    <h2 style={{ marginTop: '10px', fontSize: '1.6rem', color: '#1e293b' }}>Create Account</h2>
                    <p style={{ color: '#64748b', marginTop: '5px' }}>Join NovaCart and shop fresh today</p>
                </div>
                {error && <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#dc2626', padding: '10px 15px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem' }}>{error}</div>}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '6px', fontSize: '0.9rem' }}>Full Name</label>
                        <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Doe" required style={inputStyle} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '6px', fontSize: '0.9rem' }}>Email Address</label>
                        <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="you@example.com" required style={inputStyle} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '6px', fontSize: '0.9rem' }}>Password</label>
                        <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min. 6 characters" required style={inputStyle} />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontWeight: '600', color: '#374151', marginBottom: '6px', fontSize: '0.9rem' }}>Confirm Password</label>
                        <input type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} placeholder="Repeat password" required style={inputStyle} />
                    </div>
                    <button type="submit" disabled={loading} style={{ padding: '14px', background: loading ? '#9ca3af' : 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer' }}>
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>
                <p style={{ textAlign: 'center', marginTop: '20px', color: '#64748b', fontSize: '0.9rem' }}>
                    Already have an account? <Link to="/login" style={{ color: '#059669', fontWeight: '700', textDecoration: 'none' }}>Sign in</Link>
                </p>
            </div>
        </main>
    );
};

export default Signup;
