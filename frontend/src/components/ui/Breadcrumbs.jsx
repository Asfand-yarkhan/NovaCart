import { Link } from 'react-router-dom';

/** <Breadcrumbs items={[{ label: 'Shop', to: '/shop' }, { label: 'Bananas' }]} /> – last item is the current page. */
export default function Breadcrumbs({ items }) {
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        <li><Link to="/">Home</Link></li>
        {items.map((item, i) => (
          <li key={i}>
            {item.to && i < items.length - 1
              ? <Link to={item.to}>{item.label}</Link>
              : <span aria-current="page">{item.label}</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}
