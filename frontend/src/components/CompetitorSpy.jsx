import React, { useState } from 'react';
import api from '../api';

const CompetitorSpy = ({ businessId }) => {
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState(null);

    const spyOnCompetitor = async () => {
        if (!name) return;
        setLoading(true);
        try {
            const res = await api.post('/competitors', { business_id: businessId, competitor_name: name });
            setAnalysis(res.data.swot_analysis);
        } catch (error) {
            console.error("Spying failed", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <h3>Competitor Spy: SWOT Analysis</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                    type="text"
                    placeholder="Competitor Name..."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ flex: 1, padding: '0.5rem', borderRadius: '0.5rem', background: '#2a2a2a', color: 'white', border: '1px solid #444' }}
                />
                <button onClick={spyOnCompetitor} disabled={loading} className="primary-button">Spy</button>
            </div>

            {loading && <p style={{ marginTop: '1rem' }}>Performing intelligence scan...</p>}

            {analysis && (
                <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    {Object.entries(analysis).map(([key, list]) => (
                        <div key={key} style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
                            <strong style={{ textTransform: 'capitalize', fontSize: '0.85rem' }}>{key}</strong>
                            <ul style={{ paddingLeft: '1.2rem', margin: '0.25rem 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                {list.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CompetitorSpy;
