/** Approximation of a Google result for the product page, so editors can see their SEO fields in context. */
export default function SerpPreview({ title, description, slug }) {
  return (
    <div>
      <div className="adm-serp" aria-label="Search result preview">
        <div className="adm-serp-site">
          <span className="adm-serp-fav" aria-hidden="true">
            <svg viewBox="0 0 32 32" width="16" height="16"><circle cx="16" cy="16" r="16" fill="#2f6b3f" /><path d="M10 22.5c0-7 4.6-12 12.5-12.5-.3 7.9-5.4 12.5-12.5 12.5Z" fill="#fff" /></svg>
          </span>
          <div>
            <strong>NovaCart</strong>
            <span>https://novacart.pk › product › {slug || 'your-product'}</span>
          </div>
        </div>
        <div className="adm-serp-title">{title || 'Product title | NovaCart'}</div>
        <div className="adm-serp-desc">{description || 'Add a meta description so shoppers know what they are clicking on.'}</div>
      </div>
      <p className="adm-serp-caption">Preview only. Search engines may rewrite titles and descriptions.</p>
    </div>
  );
}
