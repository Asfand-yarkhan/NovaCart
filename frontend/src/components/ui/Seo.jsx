import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { SITE_URL } from '../../lib/assets';

/**
 * Per-page SEO: title, description, keywords, canonical, Open Graph, Twitter and optional JSON-LD.
 * <Seo title="Shop" description="..." image="/uploads/x.jpg" jsonLd={{...}} noindex />
 */
export default function Seo({ title, description, keywords, image, type = 'website', jsonLd, noindex = false, rawTitle = false }) {
  const { pathname, search } = useLocation();
  const fullTitle = rawTitle ? title : title ? `${title} | NovaCart` : 'NovaCart | Fresh groceries delivered in Pakistan';
  const desc = description || 'Order fresh fruit, vegetables, dairy, meat and pantry staples online. Same-day delivery slots in Lahore, Karachi and Islamabad.';
  const url = `${SITE_URL}${pathname}${search}`;
  const img = image ? (image.startsWith('http') ? image : `${SITE_URL}${image}`) : `${SITE_URL}/images/hero-bags.jpg`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={desc} />
      {keywords && <meta name="keywords" content={keywords} />}
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <meta property="og:site_name" content="NovaCart" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={desc} />
      <meta name="twitter:image" content={img} />
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
