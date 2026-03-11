import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch products from backend
    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            setIsLoading(true);
            const response = await fetch('http://localhost:5000/api/products');
            if (!response.ok) throw new Error('Failed to fetch products');
            const data = await response.json();
            setProducts(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (product) => {
        setCurrentProduct(product);
        setIsEditing(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            const url = currentProduct._id
                ? `http://localhost:5000/api/products/${currentProduct._id}`
                : 'http://localhost:5000/api/products';

            const method = currentProduct._id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(currentProduct)
            });

            if (!response.ok) throw new Error('Failed to save product');

            await fetchProducts(); // Refresh list
            setIsEditing(false);
            setCurrentProduct(null);
        } catch (err) {
            alert(err.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;

        try {
            const response = await fetch(`http://localhost:5000/api/products/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete product');
            await fetchProducts();
        } catch (err) {
            alert(err.message);
        }
    };

    const handleCreateNew = () => {
        setCurrentProduct({ name: '', price: '', stock: '', category: '', slug: '', metaTitle: '', metaDescription: '', metaKeywords: '' });
        setIsEditing(true);
    };

    if (isLoading) return <div style={{ padding: '20px' }}>Loading products...</div>;
    if (error) return <div style={{ padding: '20px', color: 'red' }}>Error: {error}</div>;

    return (
        <div>
            <Helmet>
                <title>Products Management | NovaAdmin</title>
            </Helmet>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ fontSize: '1.8rem', color: '#1e293b' }}>Products</h1>
                {!isEditing && (
                    <button
                        onClick={handleCreateNew}
                        style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <i className="fa-solid fa-plus"></i> Add Product
                    </button>
                )}
            </div>

            {isEditing ? (
                <div style={{ backgroundColor: '#fff', padding: '30px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 style={{ color: '#1e293b' }}>{currentProduct._id ? 'Edit Product' : 'Add New Product'}</h2>
                        <button onClick={() => setIsEditing(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '1.5rem' }}><i className="fa-solid fa-times"></i></button>
                    </div>

                    <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {/* Basic Info */}
                        <div style={{ gridColumn: '1 / -1' }}>
                            <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px' }}>Basic Information</h3>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontWeight: 'bold', color: '#475569' }}>Product Name</label>
                            <input
                                type="text"
                                value={currentProduct.name}
                                onChange={e => setCurrentProduct({ ...currentProduct, name: e.target.value })}
                                style={{ padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }} required />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontWeight: 'bold', color: '#475569' }}>Category</label>
                            <input
                                type="text"
                                value={currentProduct.category}
                                onChange={e => setCurrentProduct({ ...currentProduct, category: e.target.value })}
                                style={{ padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }} required />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontWeight: 'bold', color: '#475569' }}>Price ($)</label>
                            <input
                                type="number"
                                step="any"
                                value={currentProduct.price}
                                onChange={e => setCurrentProduct({ ...currentProduct, price: parseFloat(e.target.value) })}
                                style={{ padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }} required />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontWeight: 'bold', color: '#475569' }}>Stock Quantity</label>
                            <input
                                type="number"
                                value={currentProduct.stock}
                                onChange={e => setCurrentProduct({ ...currentProduct, stock: parseInt(e.target.value) })}
                                style={{ padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }} required />
                        </div>

                        {/* SEO Fields */}
                        <div style={{ gridColumn: '1 / -1', marginTop: '20px' }}>
                            <h3 style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '15px' }}>SEO Optimization</h3>
                        </div>

                        <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontWeight: 'bold', color: '#475569' }}>URL Slug</label>
                            <input
                                type="text"
                                value={currentProduct.slug}
                                placeholder="e.g., fresh-organic-tomatoes"
                                onChange={e => setCurrentProduct({ ...currentProduct, slug: e.target.value })}
                                style={{ padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }} />
                            <small style={{ color: '#94a3b8' }}>The URL friendly identifier for the product page.</small>
                        </div>

                        <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontWeight: 'bold', color: '#475569' }}>Meta Title</label>
                            <input
                                type="text"
                                value={currentProduct.metaTitle}
                                placeholder="Title shown in search engines"
                                onChange={e => setCurrentProduct({ ...currentProduct, metaTitle: e.target.value })}
                                style={{ padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }} />
                            <small style={{ color: '#94a3b8' }}>Optimal length: 50-60 characters.</small>
                        </div>

                        <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontWeight: 'bold', color: '#475569' }}>Meta Description</label>
                            <textarea
                                rows="3"
                                value={currentProduct.metaDescription}
                                placeholder="Description shown in search engines"
                                onChange={e => setCurrentProduct({ ...currentProduct, metaDescription: e.target.value })}
                                style={{ padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1', resize: 'vertical' }}></textarea>
                            <small style={{ color: '#94a3b8' }}>Optimal length: 150-160 characters.</small>
                        </div>

                        <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <label style={{ fontWeight: 'bold', color: '#475569' }}>Meta Keywords</label>
                            <input
                                type="text"
                                value={currentProduct.metaKeywords}
                                placeholder="Comma separated keywords"
                                onChange={e => setCurrentProduct({ ...currentProduct, metaKeywords: e.target.value })}
                                style={{ padding: '10px', borderRadius: '5px', border: '1px solid #cbd5e1' }} />
                        </div>

                        <div style={{ gridColumn: '1 / -1', marginTop: '20px', display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setIsEditing(false)} style={{ padding: '10px 20px', backgroundColor: '#e2e8f0', color: '#475569', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Cancel</button>
                            <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#10b981', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Save Product</button>
                        </div>
                    </form>
                </div>
            ) : (
                <div style={{ backgroundColor: '#fff', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <tr>
                                <th style={{ padding: '15px', textAlign: 'left', color: '#64748b' }}>Name</th>
                                <th style={{ padding: '15px', textAlign: 'left', color: '#64748b' }}>Category</th>
                                <th style={{ padding: '15px', textAlign: 'left', color: '#64748b' }}>Price</th>
                                <th style={{ padding: '15px', textAlign: 'left', color: '#64748b' }}>Stock</th>
                                <th style={{ padding: '15px', textAlign: 'right', color: '#64748b' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>No products found in Database. Add some from above.</td>
                                </tr>
                            ) : (
                                products.map(product => (
                                    <tr key={product._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                        <td style={{ padding: '15px', fontWeight: 'bold' }}>{product.name}</td>
                                        <td style={{ padding: '15px' }}>
                                            <span style={{ backgroundColor: '#e0f2fe', color: '#0284c7', padding: '4px 8px', borderRadius: '20px', fontSize: '0.8rem' }}>{product.category}</span>
                                        </td>
                                        <td style={{ padding: '15px' }}>${product.price.toFixed(2)}</td>
                                        <td style={{ padding: '15px' }}>{product.stock}</td>
                                        <td style={{ padding: '15px', textAlign: 'right' }}>
                                            <button
                                                onClick={() => handleEdit(product)}
                                                style={{ backgroundColor: 'transparent', border: '1px solid #cbd5e1', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', color: '#475569', marginRight: '10px' }}>
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product._id)}
                                                style={{ backgroundColor: '#fee2e2', border: '1px solid #f87171', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer', color: '#ef4444' }}>
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Products;
