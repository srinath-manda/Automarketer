import React, { useState, useEffect } from 'react';
import api from '../api';
import { Plus, Trash2, Package, Tag, Info } from 'lucide-react';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        offers: '',
        price: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const busRes = await api.get('/businesses');
            if (busRes.data.length > 0) {
                const activeBus = busRes.data[0];
                setBusiness(activeBus);
                const prodRes = await api.get(`/business/${activeBus.id}/products`);
                setProducts(prodRes.data);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/products', {
                ...formData,
                business_id: business.id
            });
            setProducts([...products, res.data]);
            setFormData({ name: '', description: '', offers: '', price: '' });
            setShowAddForm(false);
        } catch (error) {
            console.error('Error creating product:', error);
            alert('Failed to create product');
        }
    };

    const handleDeleteProduct = async (productId) => {
        if (!window.confirm('Are you sure you want to delete this product?')) return;
        try {
            await api.delete(`/business/${business.id}/products/${productId}`);
            setProducts(products.filter(p => p.id !== productId));
        } catch (error) {
            console.error('Error deleting product:', error);
            alert('Failed to delete product');
        }
    };

    if (loading) return <div style={{ color: 'white' }}>Loading Products...</div>;

    return (
        <div className="products-page">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <h1 style={{ color: 'white', margin: 0 }}>Product Management</h1>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.75rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontWeight: 'bold'
                    }}
                >
                    <Plus size={20} />
                    {showAddForm ? 'Cancel' : 'Add Product'}
                </button>
            </div>

            {showAddForm && (
                <div className="card" style={{ marginBottom: '2rem', maxWidth: '600px', animation: 'fadeIn 0.3s ease' }}>
                    <h3 style={{ marginTop: 0 }}>Create New Product</h3>
                    <form onSubmit={handleCreateProduct}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Product Name</label>
                            <input
                                type="text"
                                style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', borderRadius: '0.5rem', color: 'white' }}
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="e.g., Wireless Headphones"
                            />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Description</label>
                            <textarea
                                style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', borderRadius: '0.5rem', color: 'white', minHeight: '100px' }}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="What makes this product special?"
                            />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Price ($)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', borderRadius: '0.5rem', color: 'white' }}
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Active Offer</label>
                                <input
                                    type="text"
                                    style={{ width: '100%', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-light)', borderRadius: '0.5rem', color: 'white' }}
                                    value={formData.offers}
                                    onChange={(e) => setFormData({ ...formData, offers: e.target.value })}
                                    placeholder="e.g., 20% Off Limited Time"
                                />
                            </div>
                        </div>
                        <button type="submit" className="button" style={{ width: '100%' }}>Create Product</button>
                    </form>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                {products.length === 0 ? (
                    <div style={{ color: 'var(--text-secondary)', padding: '2rem', textAlign: 'center', gridColumn: '1 / -1' }}>
                        No products found. Start by adding one!
                    </div>
                ) : (
                    products.map(product => (
                        <div key={product.id} className="card" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ background: 'rgba(79, 70, 229, 0.1)', padding: '0.5rem', borderRadius: '0.5rem' }}>
                                    <Package size={24} color="var(--primary)" />
                                </div>
                                <button
                                    onClick={() => handleDeleteProduct(product.id)}
                                    style={{ background: 'none', border: 'none', color: '#FF6B6B', cursor: 'pointer', padding: '0.25rem' }}
                                >
                                    <Trash2 size={20} />
                                </button>
                            </div>

                            <h3 style={{ margin: '0 0 0.5rem 0' }}>{product.name}</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', flex: 1, marginBottom: '1rem' }}>{product.description || 'No description provided.'}</p>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {product.price && (
                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.25rem 0.75rem', borderRadius: '1rem', size: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                        <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>${product.price}</div>
                                    </div>
                                )}
                                {product.offers && (
                                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', padding: '0.25rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 'bold' }}>
                                        <Tag size={12} />
                                        {product.offers}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Products;
