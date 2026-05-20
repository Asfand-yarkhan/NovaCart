import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { api } from '../../frontend/src/utils/api';

const API_BASE = 'http://localhost:5000';

const emptyProduct = { name: '', description: '', price: '', stock: '', category: '', slug: '', metaTitle: '', metaDescription: '', metaKeywords: '' };

const slugify = (text) => {
    return String(text || '')
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
};

const Products = () => {
    const [products, setProducts] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [saving, setSaving] = useState(false);
    const [seoGenerating, setSeoGenerating] = useState(false);

    useEffect(() => { fetchProducts(); }, []);

    const handleNameChange = (newName) => {
        setCurrentProduct(prev => {
            const updated = { ...prev, name: newName };
            const oldSlug = slugify(prev.name || '');
            if (!prev.slug || prev.slug === oldSlug) {
                updated.slug = slugify(newName);
            }
            const oldMetaTitle = prev.name?.trim() ? `${prev.name.trim()} | Buy Fresh Online at NovaCart` : '';
            if (!prev.metaTitle || prev.metaTitle === oldMetaTitle) {
                updated.metaTitle = newName.trim() ? `${newName.trim()} | Buy Fresh Online at NovaCart` : '';
            }
            const oldKeywords = prev.name?.trim() ? prev.name.trim().toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean).join(', ') : '';
            if (!prev.metaKeywords || prev.metaKeywords === oldKeywords) {
                updated.metaKeywords = newName.trim() ? newName.trim().toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').split(/\s+/).filter(Boolean).join(', ') : '';
            }
            return updated;
        });
    };

    const handleDescriptionChange = (newDesc) => {
        setCurrentProduct(prev => {
            const updated = { ...prev, description: newDesc };
            const oldMetaDesc = prev.description ? (prev.description.length > 155 ? prev.description.slice(0, 152) + '...' : prev.description) : '';
            if (!prev.metaDescription || prev.metaDescription === oldMetaDesc) {
                updated.metaDescription = newDesc ? (newDesc.length > 155 ? newDesc.slice(0, 152) + '...' : newDesc) : '';
            }
            return updated;
        });
    };

    const fetchProducts = async () => {
        setIsLoading(true);
        api('/products').then(setProducts).catch(e => setError(e.message)).finally(() => setIsLoading(false));
    };

    const handleEdit = (product) => { setCurrentProduct({ ...product }); setImageFile(null); setIsEditing(true); };
    const handleCreateNew = () => { setCurrentProduct({ ...emptyProduct }); setImageFile(null); setIsEditing(true); };

    const handleSave = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            const token = localStorage.getItem('novacart_token');
            const formData = new FormData();
            Object.keys(currentProduct).forEach(k => { if (currentProduct[k] !== undefined && currentProduct[k] !== null) formData.append(k, currentProduct[k]); });
            if (imageFile) formData.append('image', imageFile);

            const isNew = !currentProduct._id;
            const url = isNew ? `${API_BASE}/api/products` : `${API_BASE}/api/products/${currentProduct._id}`;
            const res = await fetch(url, {
                method: isNew ? 'POST' : 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Failed to save');
            await fetchProducts();
            setIsEditing(false); setCurrentProduct(null);
        } catch (err) { alert(err.message); }
        finally { setSaving(false); }
    };

    const handleGenerateSeo = async () => {
        if (!currentProduct?.name?.trim()) {
            alert('Please enter a product name first.');
            return;
        }
        setSeoGenerating(true);
        try {
            const token = localStorage.getItem('novacart_token');
            const res = await fetch(`${API_BASE}/api/products/generate-seo`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: currentProduct.name,
                    description: currentProduct.description,
                    category: currentProduct.category,
                    price: currentProduct.price,
                    excludeId: currentProduct._id || undefined,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'SEO generation failed');
            setCurrentProduct((prev) => ({
                ...prev,
                slug: data.slug || prev.slug,
                metaTitle: data.metaTitle || prev.metaTitle,
                metaDescription: data.metaDescription || prev.metaDescription,
                metaKeywords: data.metaKeywords || prev.metaKeywords,
                description: prev.description?.trim() ? prev.description : (data.description || prev.description),
            }));
        } catch (err) {
            alert(err.message);
        } finally {
            setSeoGenerating(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this product?')) return;
        try { await api(`/products/${id}`, { method: 'DELETE' }); await fetchProducts(); }
        catch (err) { alert(err.message); }
    };

    if (isLoading) return <div style={{ padding: '20px' }}>Loading products...</div>;
    if (error) return <div style={{ padding: '20px', color: '#ef4444' }}>Error: {error}</div>;

    const inputStyle = { padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', width: '100%', boxSizing: 'border-box', fontSize: '0.9rem', outline: 'none' };
    const labelStyle = { fontWeight: '600', color: '#475569', marginBottom: '5px', display: 'block', fontSize: '0.85rem' };

    return (
        <div>
            <Helmet><title>Products Management | NovaAdmin</title></Helmet>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ fontSize: '1.8rem', color: '#1e293b' }}>Products</h1>
                {!isEditing && (
                    <button onClick={handleCreateNew} style={{ padding: '10px 20px', background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <i className="fa-solid fa-plus"></i> Add Product
                    </button>
                )}
            </div>

            {isEditing ? (
                <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h2 style={{ color: '#1e293b' }}>{currentProduct._id ? 'Edit Product' : 'Add New Product'}</h2>
                        <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.4rem' }}><i className="fa-solid fa-times"></i></button>
                    </div>
                    <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px' }}>
                        {/* Basic */}
                        <div style={{ gridColumn: '1 / -1' }}><h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', color: '#334155' }}>Basic Information</h3></div>
                        <div><label style={labelStyle}>Product Name *</label><input type="text" value={currentProduct.name} onChange={e => handleNameChange(e.target.value)} style={inputStyle} required /></div>
                        <div><label style={labelStyle}>Category *</label><input type="text" value={currentProduct.category} onChange={e => setCurrentProduct({ ...currentProduct, category: e.target.value })} style={inputStyle} required /></div>
                        <div><label style={labelStyle}>Price (Rs.) *</label><input type="number" step="any" value={currentProduct.price} onChange={e => setCurrentProduct({ ...currentProduct, price: parseFloat(e.target.value) })} style={inputStyle} required /></div>
                        <div><label style={labelStyle}>Stock Quantity *</label><input type="number" value={currentProduct.stock} onChange={e => setCurrentProduct({ ...currentProduct, stock: parseInt(e.target.value) })} style={inputStyle} required /></div>
                        <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Description</label><textarea rows="3" value={currentProduct.description} onChange={e => handleDescriptionChange(e.target.value)} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Product description shown on the detail page..."></textarea></div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={labelStyle}>Product Image</label>
                            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} style={{ ...inputStyle, padding: '8px' }} />
                            {currentProduct.image && !imageFile && (
                                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <img src={`${API_BASE}${currentProduct.image}`} alt="current" style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '8px' }} />
                                    <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Current image (upload new to replace)</span>
                                </div>
                            )}
                            {imageFile && <p style={{ fontSize: '0.8rem', color: '#059669', marginTop: '6px' }}>✓ New image selected: {imageFile.name}</p>}
                        </div>
                        {/* SEO */}
                        <div style={{ gridColumn: '1 / -1', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                            <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', color: '#334155', margin: 0, flex: 1 }}>SEO Optimization</h3>
                            <button
                                type="button"
                                onClick={handleGenerateSeo}
                                disabled={seoGenerating || !currentProduct.name?.trim()}
                                style={{
                                    padding: '8px 16px',
                                    background: seoGenerating ? '#9ca3af' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: seoGenerating ? 'not-allowed' : 'pointer',
                                    fontWeight: '600',
                                    fontSize: '0.85rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                }}
                            >
                                <i className={`fa-solid ${seoGenerating ? 'fa-spinner fa-spin' : 'fa-wand-magic-sparkles'}`}></i>
                                {seoGenerating ? 'Generating...' : 'Generate SEO with AI'}
                            </button>
                        </div>
                        <div style={{ gridColumn: '1 / -1', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 14px', fontSize: '0.85rem', color: '#166534' }}>
                            <i className="fa-solid fa-robot" style={{ marginRight: '8px' }}></i>
                            Empty SEO fields are filled automatically when you save. Use the button above to preview or refresh AI-generated SEO.
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>URL Slug</label><input type="text" value={currentProduct.slug} onChange={e => setCurrentProduct({ ...currentProduct, slug: e.target.value })} placeholder="Auto-generated from product name if empty" style={inputStyle} /><small style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Leave blank for AI to create a URL-friendly slug</small></div>
                        <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Meta Title</label><input type="text" value={currentProduct.metaTitle} onChange={e => setCurrentProduct({ ...currentProduct, metaTitle: e.target.value })} placeholder="Title shown in search engines (50–60 chars)" style={inputStyle} /></div>
                        <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Meta Description</label><textarea rows="3" value={currentProduct.metaDescription} onChange={e => setCurrentProduct({ ...currentProduct, metaDescription: e.target.value })} placeholder="Shown in search results (150–160 chars)" style={{ ...inputStyle, resize: 'vertical' }}></textarea></div>
                        <div style={{ gridColumn: '1 / -1' }}><label style={labelStyle}>Meta Keywords</label><input type="text" value={currentProduct.metaKeywords} onChange={e => setCurrentProduct({ ...currentProduct, metaKeywords: e.target.value })} placeholder="Comma separated keywords" style={inputStyle} /></div>
                        <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '8px' }}>
                            <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '10px 22px', background: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                            <button type="submit" disabled={saving} style={{ padding: '10px 22px', background: saving ? '#9ca3af' : 'linear-gradient(135deg, #059669, #10b981)', color: '#fff', border: 'none', borderRadius: '8px', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: '700' }}>
                                {saving ? 'Saving...' : 'Save Product'}
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div style={{ backgroundColor: '#fff', borderRadius: '12px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>{['Image', 'Name', 'Category', 'Price', 'Stock', 'Actions'].map(h => <th key={h} style={{ padding: '14px 16px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '0.85rem' }}>{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {products.length === 0 ? (
                                <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>No products yet. Add your first product above.</td></tr>
                            ) : products.map(product => (
                                <tr key={product._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px 16px' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#f0fdf4', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {product.image ? <img src={`${API_BASE}${product.image}`} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <i className="fa-solid fa-basket-shopping" style={{ color: '#6ee7b7' }}></i>}
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px 16px', fontWeight: '700', color: '#1e293b' }}>{product.name}</td>
                                    <td style={{ padding: '12px 16px' }}><span style={{ backgroundColor: '#e0f2fe', color: '#0284c7', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '600' }}>{product.category}</span></td>
                                    <td style={{ padding: '12px 16px', fontWeight: '600', color: '#059669' }}>Rs. {product.price?.toFixed(2)}</td>
                                    <td style={{ padding: '12px 16px', color: product.stock === 0 ? '#ef4444' : '#374151' }}>{product.stock}</td>
                                    <td style={{ padding: '12px 16px', display: 'flex', gap: '8px' }}>
                                        <button onClick={() => handleEdit(product)} style={{ padding: '6px 14px', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', color: '#475569', background: '#fff', fontWeight: '600', fontSize: '0.85rem' }}>Edit</button>
                                        <button onClick={() => handleDelete(product._id)} style={{ padding: '6px 14px', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', color: '#ef4444', background: '#fff', fontWeight: '600', fontSize: '0.85rem' }}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Products;
