import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDate, formatPrice } from '../../lib/format';

const H = 260;
const PAD = { top: 16, right: 16, bottom: 28, left: 56 };

const niceStep = (max, ticks = 4) => {
  if (max <= 0) return 1000;
  const raw = max / ticks;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * mag;
};

const axisMoney = (v, compact) => {
  if (!compact) return v.toLocaleString('en-PK');
  if (v >= 1_000_000) return `${+(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `${+(v / 1000).toFixed(1)}K`;
  return String(v);
};

const dayLabel = (iso) => formatDate(`${iso}T12:00:00`, { day: 'numeric', month: 'short' });

/** Single-series revenue area chart with crosshair tooltip, keyboard focus and a table view. */
export default function RevenueChart({ series }) {
  const wrapRef = useRef(null);
  const [width, setWidth] = useState(640);
  const [active, setActive] = useState(null);
  const [showTable, setShowTable] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [showTable, series.length]);

  const geo = useMemo(() => {
    const max = Math.max(0, ...series.map(d => d.revenue));
    const step = niceStep(max);
    const top = Math.max(step, Math.ceil(max / step) * step);
    const ticks = [];
    for (let v = 0; v <= top + 1e-6; v += step) ticks.push(v);
    const compact = top >= 10000;
    const iw = width - PAD.left - PAD.right;
    const ih = H - PAD.top - PAD.bottom;
    const x = (i) => PAD.left + (series.length <= 1 ? iw / 2 : (i / (series.length - 1)) * iw);
    const y = (v) => PAD.top + ih - (v / top) * ih;
    const pts = series.map((d, i) => [x(i), y(d.revenue)]);
    const line = pts.map(([px, py], i) => `${i ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)}`).join('');
    const area = pts.length ? `${line}L${pts[pts.length - 1][0].toFixed(1)},${y(0)}L${pts[0][0].toFixed(1)},${y(0)}Z` : '';
    const every = Math.max(1, Math.ceil(series.length / Math.max(2, Math.floor(iw / 72))));
    return { ticks, compact, x, y, pts, line, area, every, iw };
  }, [series, width]);

  const total = series.reduce((s, d) => s + d.revenue, 0);
  const best = series.reduce((b, d) => (d.revenue > (b?.revenue ?? -1) ? d : b), null);
  const hasData = total > 0;

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * width;
    const rel = (px - PAD.left) / geo.iw;
    setActive(Math.max(0, Math.min(series.length - 1, Math.round(rel * (series.length - 1)))));
  };

  const onKey = (e) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); setActive(a => Math.min(series.length - 1, (a ?? -1) + 1)); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); setActive(a => Math.max(0, (a ?? series.length) - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(series.length - 1); }
    else if (e.key === 'Escape') setActive(null);
  };

  const a = active !== null ? series[active] : null;
  const last = geo.pts[geo.pts.length - 1];
  const tipLeft = a ? Math.min(Math.max(geo.x(active), 90), width - 90) : 0;

  return (
    <div>
      {!hasData ? (
        <div className="adm-empty-inline"><i className="fa-solid fa-chart-area" aria-hidden="true" />No revenue in this period yet. Orders will appear here as they come in.</div>
      ) : showTable ? (
        <div className="table-wrap adm-chart-table">
          <table className="table">
            <caption className="visually-hidden">Revenue and orders by day</caption>
            <thead><tr><th scope="col">Day</th><th scope="col" className="num">Orders</th><th scope="col" className="num">Revenue</th></tr></thead>
            <tbody>
              {series.map(d => (
                <tr key={d.date}><td>{dayLabel(d.date)}</td><td className="num">{d.orders}</td><td className="num">{formatPrice(d.revenue)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="adm-chart" ref={wrapRef}>
          <svg
            viewBox={`0 0 ${width} ${H}`}
            role="img"
            aria-label={`Daily revenue. Total ${formatPrice(total)}. Best day ${best ? dayLabel(best.date) : ''} with ${best ? formatPrice(best.revenue) : ''}. Use the left and right arrow keys to read each day.`}
            tabIndex={0}
            onPointerMove={onMove}
            onPointerLeave={() => setActive(null)}
            onKeyDown={onKey}
            onBlur={() => setActive(null)}
          >
            <g className="grid">
              {geo.ticks.map(t => <line key={t} x1={PAD.left} x2={width - PAD.right} y1={geo.y(t)} y2={geo.y(t)} />)}
            </g>
            <g className="axis">
              {geo.ticks.map(t => (
                <text key={t} x={PAD.left - 10} y={geo.y(t)} dy="0.32em" textAnchor="end">{axisMoney(t, geo.compact)}</text>
              ))}
              {series.map((d, i) => (i % geo.every === 0 || i === series.length - 1) && (i === series.length - 1 || series.length - 1 - i >= geo.every) ? (
                <text key={d.date} x={geo.x(i)} y={H - 8} textAnchor={i === 0 ? 'start' : i === series.length - 1 ? 'end' : 'middle'}>{dayLabel(d.date)}</text>
              ) : null)}
            </g>
            <path className="area" d={geo.area} />
            <path className="line" d={geo.line} />
            {last && !a && (
              <>
                <circle className="dot" cx={last[0]} cy={last[1]} r="4" />
                <text className="end-label" x={last[0] - 8} y={last[1] - 12} textAnchor="end">{formatPrice(series[series.length - 1].revenue)}</text>
              </>
            )}
            {a && (
              <>
                <line className="cross" x1={geo.x(active)} x2={geo.x(active)} y1={PAD.top} y2={H - PAD.bottom} />
                <circle className="dot" cx={geo.pts[active][0]} cy={geo.pts[active][1]} r="5" />
              </>
            )}
            {/* full-height transparent hit area */}
            <rect x={PAD.left} y={PAD.top} width={geo.iw} height={H - PAD.top - PAD.bottom} fill="transparent" />
          </svg>
          {a && (
            <div className="adm-tip" style={{ left: `${(tipLeft / width) * 100}%` }} aria-hidden="true">
              <div className="adm-tip-date">{formatDate(`${a.date}T12:00:00`, { weekday: 'short', day: 'numeric', month: 'short' })}</div>
              <div className="adm-tip-row"><span className="adm-tip-key" /><strong>{formatPrice(a.revenue)}</strong> revenue</div>
              <div className="adm-tip-row" style={{ paddingLeft: 20 }}><strong>{a.orders}</strong> {a.orders === 1 ? 'order' : 'orders'}</div>
            </div>
          )}
          <p className="visually-hidden" aria-live="polite">{a ? `${dayLabel(a.date)}: ${formatPrice(a.revenue)}, ${a.orders} orders` : ''}</p>
        </div>
      )}

      {hasData && (
        <div className="adm-chart-summary">
          <span>Total <strong>{formatPrice(total)}</strong></span>
          {best && <span>Best day <strong>{dayLabel(best.date)}</strong>, {formatPrice(best.revenue)}</span>}
          <button type="button" className="btn-link text-xs" style={{ marginLeft: 'auto' }} onClick={() => setShowTable(s => !s)}>
            {showTable ? 'Show chart' : 'Show as table'}
          </button>
        </div>
      )}
    </div>
  );
}
