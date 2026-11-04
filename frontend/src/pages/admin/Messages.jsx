import { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api } from '../../lib/api';
import useApi from '../../components/admin/useApi';
import { formatDateTime, initials, timeAgo } from '../../lib/format';
import { useToast } from '../../context/ToastContext';
import Seo from '../../components/ui/Seo';
import { ConfirmDialog } from '../../components/ui/Dialog';
import EmptyState, { ErrorState } from '../../components/ui/EmptyState';
import PageHeader from '../../components/admin/PageHeader';

const NONE = [];

export default function Messages() {
  const { setUnread } = useOutletContext() || {};
  const toast = useToast();
  const list = useApi('/contact');
  const messages = list.data || NONE;
  const setMessages = list.setData;
  const { loaded, error } = list;
  const [selectedId, setSelectedId] = useState(null);
  const [filter, setFilter] = useState('all');
  const [toDelete, setToDelete] = useState(null);
  const [busy, setBusy] = useState(false);

  // Keep the sidebar badge in step with this list
  useEffect(() => {
    if (loaded) setUnread?.(messages.filter(m => !m.read).length);
  }, [messages, loaded, setUnread]);

  const setRead = useCallback(async (msg, read) => {
    setMessages(all => (all || []).map(m => (m._id === msg._id ? { ...m, read } : m)));
    try {
      await api(`/contact/${msg._id}`, { method: 'PATCH', body: { read } });
    } catch (err) {
      setMessages(all => (all || []).map(m => (m._id === msg._id ? { ...m, read: !read } : m)));
      toast.error(err.message);
    }
  }, [toast, setMessages]);

  const open = (msg) => {
    setSelectedId(msg._id);
    if (!msg.read) setRead(msg, true);
  };

  const confirmDelete = async () => {
    setBusy(true);
    try {
      await api(`/contact/${toDelete._id}`, { method: 'DELETE' });
      setMessages(all => (all || []).filter(m => m._id !== toDelete._id));
      if (selectedId === toDelete._id) setSelectedId(null);
      toast.success('Message deleted');
      setToDelete(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const unread = messages.filter(m => !m.read).length;
  const shown = filter === 'unread' ? messages.filter(m => !m.read) : messages;
  const selected = messages.find(m => m._id === selectedId);

  return (
    <>
      <Seo title="Messages" noindex />
      <PageHeader
        title="Messages"
        description={loaded ? (unread ? `${unread} unread from the contact form` : 'You are all caught up') : 'Questions sent through the contact form'}
        actions={
          <div className="adm-seg" role="group" aria-label="Filter messages">
            <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All</button>
            <button type="button" aria-pressed={filter === 'unread'} onClick={() => setFilter('unread')}>Unread ({unread})</button>
          </div>
        }
      />

      {error && !loaded ? <ErrorState message={error} onRetry={list.reload} /> : !loaded ? (
        <div className="adm-panel adm-inbox" aria-busy="true">
          <div className="adm-inbox-list">
            {Array.from({ length: 5 }, (_, i) => (
              <div key={i} className="adm-inbox-item" aria-hidden="true">
                <div className="skeleton skeleton-text" style={{ width: '50%' }} />
                <div className="skeleton skeleton-text" style={{ width: '80%' }} />
              </div>
            ))}
          </div>
          <div className="adm-inbox-detail"><div className="skeleton adm-skel-block" /></div>
        </div>
      ) : messages.length === 0 ? (
        <EmptyState icon="fa-inbox" title="No messages yet">
          When someone writes in through the contact page, it lands here.
        </EmptyState>
      ) : (
        <div className={`adm-panel adm-inbox${selected ? ' has-selection' : ''}`}>
          <div className="adm-inbox-list" role="list" aria-label="Messages">
            {shown.length === 0 && <p className="adm-empty-inline">No unread messages.</p>}
            {shown.map(m => (
              <button key={m._id} type="button" role="listitem"
                className={`adm-inbox-item${m.read ? '' : ' is-unread'}`}
                aria-current={m._id === selectedId ? 'true' : undefined}
                onClick={() => open(m)}>
                <span className="top"><strong>{m.name}</strong><span>{timeAgo(m.createdAt)}</span></span>
                <span className="subj">{m.subject}{!m.read && <span className="visually-hidden"> (unread)</span>}</span>
                <span className="prev">{m.message}</span>
              </button>
            ))}
          </div>

          <div className="adm-inbox-detail">
            {!selected ? (
              <p className="adm-empty-inline"><i className="fa-regular fa-envelope-open" aria-hidden="true" />Choose a message to read it.</p>
            ) : (
              <>
                <button type="button" className="btn btn-ghost btn-sm adm-inbox-back" onClick={() => setSelectedId(null)}>
                  <i className="fa-solid fa-arrow-left" aria-hidden="true" />All messages
                </button>
                <h2>{selected.subject}</h2>
                <div className="adm-inbox-from">
                  <span className="avatar" aria-hidden="true">{initials(selected.name)}</span>
                  <div>
                    <strong>{selected.name}</strong>
                    <span><a href={`mailto:${selected.email}`}>{selected.email}</a> · {formatDateTime(selected.createdAt)}</span>
                  </div>
                  {selected.orderNumber && <span className="badge badge-info">Order {selected.orderNumber}</span>}
                </div>
                <p className="adm-inbox-body">{selected.message}</p>
                <div className="adm-inbox-actions">
                  <a className="btn btn-primary" href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}&body=${encodeURIComponent(`Hi ${selected.name.split(' ')[0]},\n\n\n\nNovaCart customer care`)}`}>
                    <i className="fa-solid fa-reply" aria-hidden="true" />Reply by email
                  </a>
                  <button type="button" className="btn btn-secondary" onClick={() => setRead(selected, !selected.read)}>
                    {selected.read ? 'Mark as unread' : 'Mark as read'}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setToDelete(selected)}>
                    <i className="fa-regular fa-trash-can" aria-hidden="true" />Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ConfirmDialog open={Boolean(toDelete)} title="Delete this message?" confirmLabel="Delete" danger busy={busy}
        onConfirm={confirmDelete} onClose={() => !busy && setToDelete(null)}>
        The message from {toDelete?.name} will be removed for every admin. This cannot be undone.
      </ConfirmDialog>
    </>
  );
}
