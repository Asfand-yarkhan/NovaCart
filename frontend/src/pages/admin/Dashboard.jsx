import { useState } from 'react';
import { Link } from 'react-router-dom';
import useApi from '../../components/admin/useApi';
import { imageUrl } from '../../lib/assets';
import { formatCompact, formatDateTime, formatPrice, shortOrderId, STATUS_LABELS } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import Seo from '../../components/ui/Seo';
import { ErrorState } from '../../components/ui/EmptyState';
import PageHeader from '../../components/admin/PageHeader';
import RevenueChart from '../../components/admin/RevenueChart';

function Delta({ value, period }) {
  if (value === null || value === undefined) return <span className="adm-delta is-flat">No earlier data</span>;
  const dir = value > 0 ? 'up' : value < 0 ? 'down' : 'flat';
  const icon = dir === 'up' ? 'fa-arrow-trend-up' : dir === 'down' ? 'fa-arrow-trend-down' : 'fa-minus';
  const word = dir === 'up' ? 'up' : dir === 'down' ? 'down' : 'no change';
  return (
    <>
      <span className={`adm-delta is-${dir}`}>
        <i className={`fa-solid ${icon}`} aria-hidden="true" />
        {dir === 'flat' ? '0%' : `${Math.abs(value)}%`}
        <span className="visually-hidden"> {word}</span>
      </span>
      <span>vs previous {period} days</span>
    </>
  );
}

function Kpi({ label, value, foot, icon }) {
  return (
    <div className="adm-panel adm-kpi">
      <div className="adm-kpi-label"><i className={`fa-solid ${icon}`} aria-hidden="true" />{label}</div>
      <div className="adm-kpi-value">{value}</div>
      <div className="adm-kpi-foot">{foot}</div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading dashboard">
      <div className="adm-kpis">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="adm-panel adm-kpi">
            <div className="skeleton skeleton-text" style={{ width: '40%' }} />
            <div className="skeleton" style={{ width: '60%', height: 28, marginTop: 10 }} />
            <div className="skeleton skeleton-text" style={{ width: '70%', marginTop: 10 }} />
          </div>
        ))}
      </div>
      <div className="adm-grid-2">
        <div className="adm-panel adm-panel-body"><div className="skeleton adm-skel-block" /></div>
        <div className="adm-panel adm-panel-body"><div className="skeleton adm-skel-block" /></div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [days, setDays] = useState(14);
  const { data, error, loading, reload: load } = useApi(`/admin/stats?days=${days}`);

  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const maxStatus = data ? Math.max(1, ...data.byStatus.map(s => s.count)) : 1;
  const openOrders = data ? data.byStatus.filter(s => ['processing', 'confirmed', 'shipped'].includes(s.status)).reduce((t, s) => t + s.count, 0) : 0;

  return (
    <>
      <Seo title="Overview" noindex />
      <PageHeader
        title={`${greet}, ${user?.name?.split(' ')[0] || 'there'}`}
        description={data ? `${openOrders} open ${openOrders === 1 ? 'order needs' : 'orders need'} attention. Figures exclude cancelled orders.` : 'Store performance at a glance.'}
        actions={
          <div className="adm-seg" role="group" aria-label="Date range">
            {[7, 14, 30].map(d => (
              <button key={d} type="button" aria-pressed={days === d} onClick={() => setDays(d)}>Last {d} days</button>
            ))}
          </div>
        }
      />

      {error && !data ? <ErrorState message={error} onRetry={load} />
        : !data ? <DashboardSkeleton />
        : (
          <div className={`adm-refetch${loading ? ' is-loading' : ''}`}>
            <div className="adm-kpis">
              <Kpi icon="fa-sack-dollar" label="Revenue" value={formatPrice(data.revenue)} foot={<Delta value={data.revenueChange} period={data.days} />} />
              <Kpi icon="fa-receipt" label="Orders" value={data.orders.toLocaleString('en-PK')} foot={<Delta value={data.ordersChange} period={data.days} />} />
              <Kpi icon="fa-basket-shopping" label="Average order" value={formatPrice(data.averageOrder)} foot={<span>Per order in the last {data.days} days</span>} />
              <Kpi icon="fa-user-group" label="Customers" value={formatCompact(data.customers)} foot={<span><strong className="adm-delta is-up">+{data.newCustomers}</strong> new in this period</span>} />
            </div>

            <div className="adm-grid-2">
              <section className="adm-panel" aria-labelledby="rev-title">
                <div className="adm-panel-head">
                  <div>
                    <h2 id="rev-title">Revenue by day</h2>
                    <p>Last {data.days} days, Pakistan time</p>
                  </div>
                </div>
                <div className="adm-panel-body"><RevenueChart series={data.series} /></div>
              </section>

              <section className="adm-panel" aria-labelledby="status-title">
                <div className="adm-panel-head">
                  <div>
                    <h2 id="status-title">Orders by status</h2>
                    <p>All time</p>
                  </div>
                  <Link to="/admin/orders">View orders</Link>
                </div>
                <div className="adm-panel-body">
                  <div className="adm-bars">
                    {data.byStatus.map(s => (
                      <Link key={s.status} to={`/admin/orders?status=${s.status}`} className="adm-bar-row" style={{ '--bar-c': `var(--st-${s.status})` }}
                        aria-label={`${STATUS_LABELS[s.status]}: ${s.count} orders`}>
                        <span className="adm-bar-label">{STATUS_LABELS[s.status]}</span>
                        <span className="adm-bar-track"><span className="adm-bar-fill" style={{ width: `${(s.count / maxStatus) * 100}%`, display: s.count ? 'block' : 'none' }} /></span>
                        <span className="adm-bar-value">{s.count}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </section>
            </div>

            <div className="adm-grid-3">
              <section className="adm-panel" aria-labelledby="top-title">
                <div className="adm-panel-head">
                  <div><h2 id="top-title">Best sellers</h2><p>By revenue, last {data.days} days</p></div>
                  <Link to="/admin/products">All products</Link>
                </div>
                <div className="adm-panel-body">
                  {data.topProducts.length === 0 ? (
                    <p className="adm-empty-inline">No sales in this period.</p>
                  ) : (
                    <ol className="adm-list" role="list">
                      {data.topProducts.map(p => (
                        <li key={p._id} className="adm-list-row">
                          <img src={imageUrl(p.image)} alt="" width="40" height="40" loading="lazy" />
                          <div style={{ minWidth: 0 }}>
                            <span className="name">{p.name}</span>
                            <span className="sub">{p.units} units sold</span>
                          </div>
                          <span className="val">{formatPrice(p.revenue)}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </div>
              </section>

              <section className="adm-panel" aria-labelledby="low-title">
                <div className="adm-panel-head">
                  <div><h2 id="low-title">Running low</h2><p>10 units or fewer</p></div>
                  <Link to="/admin/products?stock=low">Restock</Link>
                </div>
                <div className="adm-panel-body">
                  {data.lowStock.length === 0 ? (
                    <p className="adm-empty-inline"><i className="fa-solid fa-circle-check" aria-hidden="true" />Everything is well stocked.</p>
                  ) : (
                    <ul className="adm-list" role="list">
                      {data.lowStock.map(p => (
                        <li key={p._id}>
                          <Link to={`/admin/products?edit=${p._id}`} className="adm-list-row">
                            <img src={imageUrl(p.image)} alt="" width="40" height="40" loading="lazy" />
                            <div style={{ minWidth: 0 }}>
                              <span className="name">{p.name}</span>
                              <span className="sub">{p.category} · {p.unit}</span>
                            </div>
                            <span className={`badge ${p.stock === 0 ? 'badge-danger' : 'badge-warn'}`}>{p.stock === 0 ? 'Out of stock' : `${p.stock} left`}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>

            <section className="adm-panel" aria-labelledby="recent-title">
              <div className="adm-panel-head">
                <div><h2 id="recent-title">Latest orders</h2></div>
                <Link to="/admin/orders">See all</Link>
              </div>
              <div className="table-wrap" style={{ marginTop: 'var(--space-3)' }}>
                <table className="table adm-table">
                  <thead>
                    <tr><th scope="col">Order</th><th scope="col">Customer</th><th scope="col">Placed</th><th scope="col">Status</th><th scope="col" className="num">Total</th></tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.length === 0 ? (
                      <tr><td colSpan="5" className="adm-empty-inline">No orders yet.</td></tr>
                    ) : data.recentOrders.map(o => (
                      <tr key={o._id}>
                        <td><Link className="link-strong" to={`/admin/orders?open=${o._id}`}>{shortOrderId(o)}</Link></td>
                        <td>{o.shippingAddress?.fullName || o.user?.name}<div className="cell-sub">{o.shippingAddress?.city}</div></td>
                        <td>{formatDateTime(o.createdAt)}</td>
                        <td><span className={`status status-${o.status}`}>{STATUS_LABELS[o.status]}</span></td>
                        <td className="num">{formatPrice(o.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
    </>
  );
}
