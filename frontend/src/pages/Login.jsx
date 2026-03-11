import React from 'react';
import { Helmet } from 'react-helmet-async';

const Login = () => {
    return (
        <main className="section-padding" style={{ minHeight: '60vh', marginTop: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Helmet>
                <title>Login / Sign Up | NovaCart</title>
                <meta name="description" content="Log in to your NovaCart account to track orders, manage your profile, and experience faster checkouts." />
                <meta name="keywords" content="login, sign in, register, account, NovaCart login" />
            </Helmet>
            <div className="container" style={{ maxWidth: '400px', background: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Welcome Back</h2>
                <form style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input type="email" placeholder="Email Address" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} required />
                    <input type="password" placeholder="Password" style={{ padding: '12px', borderRadius: '8px', border: '1px solid #ddd' }} required />
                    <button className="btn btn-primary" type="submit" style={{ width: '100%', padding: '12px' }}>Log In</button>
                    <p style={{ textAlign: 'center', marginTop: '10px' }}>
                        Don't have an account? <a href="#" style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>Sign Up</a>
                    </p>
                </form>
            </div>
        </main>
    );
};

export default Login;
