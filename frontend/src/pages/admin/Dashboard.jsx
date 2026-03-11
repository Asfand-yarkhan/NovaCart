import React from 'react';

const Dashboard = () => {
    const stats = [
        { label: 'Total Revenue', value: '$24,562', icon: 'fa-dollar-sign', color: '#10b981' },
        { label: 'Total Orders', value: '1,245', icon: 'fa-shopping-cart', color: '#3b82f6' },
        { label: 'Total Customers', value: '892', icon: 'fa-users', color: '#8b5cf6' },
        { label: 'Products', value: '1,452', icon: 'fa-box', color: '#f59e0b' }
    ];

    return (
        <div>
            <h1 style={{ fontSize: '1.8rem', marginBottom: '20px', color: '#1e293b' }}>Dashboard Overview</h1>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                {stats.map((stat, i) => (
                    <div key={i} style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div>
                            <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '5px' }}>{stat.label}</p>
                            <h3 style={{ fontSize: '1.5rem', color: '#1e293b' }}>{stat.value}</h3>
                        </div>
                        <div style={{ width: '50px', height: '50px', borderRadius: '10px', backgroundColor: `${stat.color}20`, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                            <i className={`fa-solid ${stat.icon}`}></i>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', minHeight: '300px' }}>
                    <h3 style={{ marginBottom: '15px', color: '#1e293b' }}>Recent Revenue</h3>
                    <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px dashed #cbd5e1', borderRadius: '8px', color: '#94a3b8' }}>
                        [Chart Visualization Placeholder]
                    </div>
                </div>
                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', minHeight: '300px' }}>
                    <h3 style={{ marginBottom: '15px', color: '#1e293b' }}>Recent Orders</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        {[1, 2, 3, 4].map(req => (
                            <li key={req} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                                <div>
                                    <p style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Order #102{req}</p>
                                    <p style={{ color: '#64748b', fontSize: '0.8rem' }}>2 mins ago</p>
                                </div>
                                <span style={{ fontWeight: 'bold', color: '#10b981' }}>$45.00</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
