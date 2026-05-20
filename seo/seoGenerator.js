const Product = require('../database/models/Product');

const slugify = (text) =>
    String(text || '')
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

const clamp = (str, max) => {
    const s = String(str || '').trim();
    if (s.length <= max) return s;
    const cut = s.slice(0, max - 3);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).trim() + '...';
};

const generateSeoFallback = ({ name, description, category, price }) => {
    const slug = slugify(name) || 'product';
    const metaTitle = clamp(
        `${name} – Buy Online | NovaCart Pakistan`,
        60
    );
    const baseDesc =
        description?.trim() ||
        `Shop ${name} in our ${category} collection. Quality products with fast delivery across Pakistan.`;
    const metaDescription = clamp(
        `${baseDesc} Order now at NovaCart${price ? ` from Rs. ${price}` : ''}.`,
        160
    );
    const metaKeywords = [
        name,
        category,
        'NovaCart',
        'online grocery Pakistan',
        'buy online',
        `${category} delivery`,
    ]
        .filter(Boolean)
        .join(', ');

    const fallbackDesc = description?.trim() || `Enjoy our fresh and premium ${name} from the ${category} category, carefully selected and packed for maximum freshness and quality. Perfect for your daily needs.`;

    return { slug, metaTitle, metaDescription, metaKeywords, description: fallbackDesc };
};

const parseJsonFromText = (text) => {
    const raw = String(text || '').trim();
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
    const candidate = fenced ? fenced[1].trim() : raw;
    const start = candidate.indexOf('{');
    const end = candidate.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error('No JSON in AI response');
    return JSON.parse(candidate.slice(start, end + 1));
};

const generateSeoWithGemini = async (product) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    const prompt = `You are an SEO and copywriting specialist for NovaCart, a Pakistani online grocery and e-commerce store.

Generate premium SEO metadata and an attractive product description for this product. Use natural English suitable for Pakistan shoppers.

Product data:
- Name: ${product.name}
- Category: ${product.category || 'General'}
- Price (PKR): ${product.price ?? 'N/A'}
- Description: ${product.description || '(none provided)'}

Rules:
- slug: lowercase, hyphen-separated, URL-safe, based on product name (no special chars)
- metaTitle: 50–60 characters, compelling, include brand "NovaCart" if it fits
- metaDescription: 150–160 characters, include a call to action
- metaKeywords: 8–12 comma-separated relevant search terms
- description: a captivating, premium 2–3 sentence product description for the store page, highlighting the product's freshness, convenience, and value. Always generate this.

Respond with ONLY a JSON object using exactly these keys: slug, metaTitle, metaDescription, metaKeywords, description`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.4,
                maxOutputTokens: 1024,
                responseMimeType: 'application/json',
            },
        }),
    });

    if (!res.ok) {
        const errBody = await res.text();
        console.warn('Gemini SEO API error:', res.status, errBody);
        return null;
    }

    const data = await res.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return null;

    const parsed = parseJsonFromText(text);
    return {
        slug: slugify(parsed.slug || product.name),
        metaTitle: clamp(parsed.metaTitle || product.name, 60),
        metaDescription: clamp(parsed.metaDescription || '', 160),
        metaKeywords: String(parsed.metaKeywords || '').trim(),
        description: parsed.description?.trim() || undefined,
    };
};

const ensureUniqueSlug = async (baseSlug, excludeId = null) => {
    let slug = slugify(baseSlug) || 'product';
    let candidate = slug;
    let n = 1;

    while (true) {
        const query = { slug: candidate };
        if (excludeId) query._id = { $ne: excludeId };
        const exists = await Product.findOne(query).select('_id').lean();
        if (!exists) return candidate;
        n += 1;
        candidate = `${slug}-${n}`;
    }
};

const needsSeoGeneration = (data) => {
    const fields = ['slug', 'metaTitle', 'metaDescription', 'metaKeywords'];
    return fields.some((f) => !String(data[f] || '').trim());
};

const mergeSeoIntoProduct = async (data, { excludeId, enrichDescription = true } = {}) => {
    if (!data.name?.trim()) return data;

    const toGenerate = needsSeoGeneration(data);
    const descEmpty = !String(data.description || '').trim();
    if (!toGenerate && !descEmpty) return data;

    let seo;
    try {
        seo = await generateSeoWithGemini(data);
    } catch (err) {
        console.warn('AI SEO generation failed, using fallback:', err.message);
        seo = null;
    }
    if (!seo) seo = generateSeoFallback(data);

    const merged = { ...data };

    if (!String(merged.slug || '').trim()) {
        merged.slug = await ensureUniqueSlug(seo.slug, excludeId);
    } else {
        merged.slug = await ensureUniqueSlug(merged.slug, excludeId);
    }

    if (!String(merged.metaTitle || '').trim()) merged.metaTitle = seo.metaTitle;
    if (!String(merged.metaDescription || '').trim()) merged.metaDescription = seo.metaDescription;
    if (!String(merged.metaKeywords || '').trim()) merged.metaKeywords = seo.metaKeywords;

    if (
        enrichDescription &&
        descEmpty &&
        seo.description &&
        String(seo.description).trim()
    ) {
        merged.description = seo.description;
    }

    return merged;
};

const generateProductSeo = async (product, options = {}) => {
    const { excludeId } = options;
    let seo;
    try {
        seo = await generateSeoWithGemini(product);
    } catch (err) {
        console.warn('AI SEO preview failed:', err.message);
        seo = null;
    }
    if (!seo) seo = generateSeoFallback(product);
    seo.slug = await ensureUniqueSlug(seo.slug, excludeId);
    return seo;
};

module.exports = {
    generateProductSeo,
    mergeSeoIntoProduct,
    generateSeoFallback,
    slugify,
};
