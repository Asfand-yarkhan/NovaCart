import React, { useEffect, useState } from 'react';
import { api } from '../../utils/api';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        api('/users').then(setUsers).catch(err => setError(err.message)).finally(() => setLoading(false));
    }, []);

    const toggleRole = async (user) => {
        const newRole = user.role === 'admin' ? 'user' : 'admin';
        if (!window.confirm(`Change ${user.name}'s role to "${newRole}"?`)) return;
        setUpdatingId(user._id);
        try {
            const updated = await api(`/users/${user._id}/role`, {
                method: 'PUT',
                body: JSON.stringify({ role: newRole })
            });
            setUsers(prev => prev.map(u => u._id === user._id ? { ...u, role: updated.role } : u));
        } catch (err) { alert(err.message); }
        finally { setUpdatingId(null); }
    };

    if (loading) return <div style={{ padding: '20px' }}>Loading users...</div>;
    if (error) return <div style={{ padding: '20px', color: '#ef4444' }}>Error: {error}</div>;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.8rem', color: '#1e293b' }}>User Management</h1>
                <span style={{ background: '#f0f9ff', color: '#0284c7', padding: '6px 14px', borderRadius: '20px', fontWeight: '600', fontSize: '0.85rem' }}>{users.length} Users</span>
            </div>
            <div style={{ background: '#fff', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                {users.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No users registered yet.</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                {['User', 'Email', 'Role', 'Joined', 'Actions'].map(h => (
                                    <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '0.85rem' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '14px 16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #059669, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '700', fontSize: '0.9rem', flexShrink: 0 }}>
                                                {user.name?.charAt(0).toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: '600', color: '#1e293b' }}>{user.name}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.9rem' }}>{user.email}</td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <span style={{ padding: '4px 12px', borderRadius: '20px', background: user.role === 'admin' ? '#fef3c7' : '#f0fdf4', color: user.role === 'admin' ? '#d97706' : '#059669', fontWeight: '700', fontSize: '0.8rem' }}>
                                            {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '0.85rem' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                                    <td style={{ padding: '14px 16px' }}>
                                        <button
                                            onClick={() => toggleRole(user)}
                                            disabled={updatingId === user._id}
                                            style={{ padding: '6px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', background: '#fff', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '600', color: user.role === 'admin' ? '#ef4444' : '#8b5cf6', transition: 'all 0.2s' }}>
                                            {updatingId === user._id ? '...' : user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdminUsers;
