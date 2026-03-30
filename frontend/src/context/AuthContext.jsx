import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('novacart_token'));
    const [loading, setLoading] = useState(true);

    // Restore session on mount
    useEffect(() => {
        const savedToken = localStorage.getItem('novacart_token');
        if (savedToken) {
            setToken(savedToken);
            api('/auth/me').then(userData => {
                setUser(userData);
            }).catch(() => {
                localStorage.removeItem('novacart_token');
                setToken(null);
            }).finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (email, password) => {
        const data = await api('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
        localStorage.setItem('novacart_token', data.token);
        setToken(data.token);
        setUser(data);
        return data;
    };

    const register = async (name, email, password) => {
        const data = await api('/auth/register', {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        });
        localStorage.setItem('novacart_token', data.token);
        setToken(data.token);
        setUser(data);
        return data;
    };

    const logout = () => {
        localStorage.removeItem('novacart_token');
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
