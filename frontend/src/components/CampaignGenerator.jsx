import React, { useState } from 'react';
import api from '../api';

const CampaignGenerator = ({ businessId }) => {
    const [loading, setLoading] = useState(false);
    const [campaign, setCampaign] = useState(null);

    const generateCampaign = async () => {
        setLoading(true);
        try {
            const res = await api.post('/campaign', { business_id: businessId });
            setCampaign(res.data);
        } catch (error) {
            console.error("Error generating campaign", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card">
            <h3>Strategic Depth: 7-Day Campaign</h3>
            {!campaign ? (
                <button
                    onClick={generateCampaign}
                    disabled={loading}
                    className="primary-button"
                    style={{ width: '100%' }}
                >
                    {loading ? 'Designing Strategy...' : 'Generate 7-Day Campaign'}
                </button>
            ) : (
                <div style={{ marginTop: '1rem' }}>
                    {Object.entries(campaign.strategy).map(([day, details]) => (
                        <div key={day} style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '0.5rem' }}>
                            <strong style={{ color: 'var(--primary-color)' }}>{day}: {details.Topic}</strong>
                            <p style={{ fontSize: '0.85rem', margin: '0.5rem 0' }}>{details.Post_Content}</p>
                            <div style={{ fontSize: '0.75rem', opacity: 0.7 }}>Platform: {details.Platform}</div>
                        </div>
                    ))}
                    <button onClick={() => setCampaign(null)} className="secondary-button" style={{ width: '100%' }}>New Campaign</button>
                </div>
            )}
        </div>
    );
};

export default CampaignGenerator;
