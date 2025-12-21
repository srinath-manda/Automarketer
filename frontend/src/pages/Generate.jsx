import React, { useState, useEffect } from 'react';
import api from '../api';
import ContentGenerator from '../components/ContentGenerator';
import CampaignGenerator from '../components/CampaignGenerator';
import { Sparkles, Megaphone } from 'lucide-react';

const Generate = () => {
    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const busRes = await api.get('/businesses');
            if (busRes.data.length > 0) {
                setBusiness(busRes.data[0]);
            }
        } catch (error) {
            console.error('Error fetching business info:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ color: 'white' }}>Loading Generators...</div>;

    return (
        <div className="generate-page">
            <header style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ color: 'white', marginBottom: '0.5rem' }}>Creative Studio 🪄</h1>
                <p style={{ color: 'var(--text-secondary)' }}>Choose a tool to create high-impact marketing materials.</p>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                {/* Main Content Generator */}
                <div>
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <Sparkles color="var(--primary)" />
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Post & Article Generator</h2>
                        </div>
                        <ContentGenerator businessId={business?.id} />
                    </div>
                </div>

                {/* Sidebar: Campaign Planning */}
                <div>
                    <div className="card" style={{ position: 'sticky', top: '2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <Megaphone color="#10B981" />
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Strategic Campaigns</h2>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                            Generate an automated 7-day marketing strategy tailored to your niche.
                        </p>
                        <CampaignGenerator businessId={business?.id} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Generate;
