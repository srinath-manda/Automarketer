import React, { useState } from 'react';
import api from '../api';

const newsCategories = ['Technology', 'E-commerce', 'Sustainability', 'Marketing', 'Business'];

const Newsjacking = ({ businessId }) => {
    const [query, setQuery] = useState(newsCategories[0]);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleNewsjack = async () => {
        setLoading(true);
        try {
            const res = await api.post('/newsjacking', { business_id: businessId, query });
            setResult(res.data);
        } catch (error) {
            console.error("Newsjacking failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <h3>Hyper-Reality: Newsjacking</h3>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <select
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', background: '#2a2a2a', color: 'white', border: '1px solid #444' }}
                >
                    {newsCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <button onClick={handleNewsjack} disabled={loading} className="primary-button">
                    Scan News
                </button>
            </div>

            {loading && <p>Scanning breaking news...</p>}

            {result && result.news_item && (
                <div style={{ borderLeft: '3px solid var(--primary)', paddingLeft: '1rem', marginTop: '1rem' }}>
                    <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem' }}>{result.news_item.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{result.news_item.body}</p>
                    <div className="card" style={{ background: 'rgba(79, 70, 229, 0.1)', marginTop: '0.5rem' }}>
                        <strong>Generated Reaction:</strong>
                        <p style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>
                            {typeof result.generated_post === 'object'
                                ? result.generated_post.post_content
                                : result.generated_post}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Newsjacking;
