import { useEffect, useMemo, useState } from 'react';
import { api, qs } from '../../lib/api';
import useApi from '../../components/admin/useApi';
import { formatDate, formatPrice, initials, timeAgo } from '../../lib/format';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import Seo from '../../components/ui/Seo';
import { ConfirmDialog } from '../../components/ui/Dialog';
import EmptyState, { ErrorState } from '../../components/ui/EmptyState';
import PageHeader from '../../components/admin/PageHeader';

const NONE = [];

export default function Users() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [role, setRole] = useState('all');
  const [pending, setPending] = useState(null); // { user, role }
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 250);
    return () => clearTimeout(t);
  }, [q]);

  const list = useApi(`/users${qs({ q: debouncedQ })}`);
  const users = list.data || NONE;
  const { loaded, loading, error } = list;

  const rows = useMemo(() => (role === 'all' ? users : users.filter(u => u.role === role)), [users, role]);
  const admins = users.filter(u => u.role === 'admin').length;

  const confirm = async () => {
    setBusy(true);
    try {
      const saved = await api(`/users/${pending.user._id}/role`, { method: 'PUT', body: { role: pending.role } });
      list.setData(all => (all || []).map(u => (u._id === saved._id ? { ...u, role: saved.role } : u)));
      toast.success(saved.role === 'admin' ? `${saved.name} is now an admin` : `${saved.name} is now a customer`);
      setPending(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Seo title="Customers" noindex />
      <PageHeader
        title="Customers"
        description={loaded ? `${users.length - admins} customers and ${admins} ${admins === 1 ? 'admin' : 'admins'}` : 'Everyone with an account'}
      />

      <div className="adm-toolbar">
        <div className="input-group">
          <i className="fa-solid fa-magnifying-glass" aria-hidden="true" />
          <input className="input" type="search" placeholder="Name, email or phone" aria-label="Search customers" value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="adm-seg" role="group" aria-label="Filter by role">
          {[['all', 'Everyone'], ['user', 'Customers'], ['admin', 'Admins']].map(([v, l]) => (
            <button key={v} type="button" aria-pressed={role === v} onClick={() => setRole(v)}>{l}</button>
          ))}
        </div>
        {loaded && <span className="adm-toolbar-meta">{rows.length} shown</span>}
      </div>

      {error && !loaded ? <ErrorState message={error} onRetry={list.reload} /> : (
        loaded && rows.length === 0 ? (
          <EmptyState icon="fa-user-group" title={debouncedQ ? 'No one matches that search' : 'No accounts here yet'}>
            {debouncedQ ? 'Try part of their email address or phone number.' : 'Customers appear here as soon as they sign up.'}
          </EmptyState>
        ) : (
          <div className={`adm-panel adm-refetch${loading && loaded ? ' is-loading' : ''}`}>
            <div className="table-wrap">
              <table className="table adm-table">
                <thead>
                  <tr>
                    <th scope="col">Name</th>
                    <th scope="col">Phone</th>
                    <th scope="col">Role</th>
                    <th scope="col" className="num">Orders</th>
                    <th scope="col" className="num">Spent</th>
                    <th scope="col">Joined</th>
                    <th scope="col">Last order</th>
                    <th scope="col"><span className="visually-hidden">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {!loaded ? Array.from({ length: 6 }, (_, i) => (
                    <tr key={i} className="adm-row-skel" aria-hidden="true">
                      {Array.from({ length: 8 }, (_, j) => <td key={j}><div className="skeleton skeleton-text" style={{ width: j === 0 ? 160 : 60 }} /></td>)}
                    </tr>
                  )) : rows.map(u => {
                    const isMe = u._id === me?._id;
                    const nextRole = u.role === 'admin' ? 'user' : 'admin';
                    return (
                      <tr key={u._id}>
                        <td>
                          <div className="adm-user-cell">
                            <span className="avatar" aria-hidden="true">{initials(u.name)}</span>
                            <div>
                              <strong>{u.name}{isMe && <span className="cell-sub"> (you)</span>}</strong>
                              <a className="cell-sub" href={`mailto:${u.email}`}>{u.email}</a>
                            </div>
                          </div>
                        </td>
                        <td>{u.phone ? <a href={`tel:${u.phone.replace(/[^\d+]/g, '')}`}>{u.phone}</a> : <span className="cell-sub">Not given</span>}</td>
                        <td><span className={`badge ${u.role === 'admin' ? 'badge-solid' : ''}`}>{u.role === 'admin' ? 'Admin' : 'Customer'}</span></td>
                        <td className="num">{u.orders}</td>
                        <td className="num">{formatPrice(u.spent)}</td>
                        <td>{formatDate(u.createdAt)}</td>
                        <td>{u.lastOrder ? timeAgo(u.lastOrder) : <span className="cell-sub">Never</span>}</td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm"
                              disabled={isMe}
                              title={isMe ? 'You cannot change your own role' : undefined}
                              aria-label={isMe ? 'You cannot change your own role' : nextRole === 'admin' ? `Make ${u.name} an admin` : `Remove admin access from ${u.name}`}
                              onClick={() => setPending({ user: u, role: nextRole })}
                            >
                              {nextRole === 'admin' ? 'Make admin' : 'Remove admin'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

      <ConfirmDialog
        open={Boolean(pending)}
        title={pending?.role === 'admin' ? 'Give admin access?' : 'Remove admin access?'}
        confirmLabel={pending?.role === 'admin' ? 'Make admin' : 'Remove access'}
        danger={pending?.role === 'admin'}
        busy={busy}
        onConfirm={confirm}
        onClose={() => !busy && setPending(null)}
      >
        {pending && (pending.role === 'admin'
          ? <>{pending.user.name} will be able to edit products, change orders and manage other accounts.</>
          : <>{pending.user.name} will lose access to the store admin and become a regular customer.</>)}
      </ConfirmDialog>
    </>
  );
}
