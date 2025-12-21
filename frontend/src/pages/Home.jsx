import React, { useState, useEffect } from 'react';
import api from '../api';
import Newsjacking from '../components/Newsjacking';
import CompetitorSpy from '../components/CompetitorSpy';
import ViralDoctor from '../components/ViralDoctor';
import { TrendingUp, Zap, Target, Award } from 'lucide-react';

const Home = () => {
    const [business, setBusiness] = useState(null);
    const [trends, setTrends] = useState([]);
    const [loading, setLoading] = useState(true);

    const [magicLoading, setMagicLoading] = useState(false);
    const [magicMessage, setMagicMessage] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const runMagicAutomation = async () => {
        if (!business) return;
        setMagicLoading(true);
        try {
            const res = await api.post(`/scheduler/auto-trending/${business.id}`, {
                platforms: ['Instagram', 'LinkedIn', 'Twitter']
            });
            if (res.data.success) {
                setMagicMessage("✨ Magic complete! Check your History.");
                setTimeout(() => setMagicMessage(null), 5000);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setMagicLoading(false);
        }
    };

    const fetchData = async () => {
        try {
            const busRes = await api.get('/businesses');
            if (busRes.data.length > 0) {
                setBusiness(busRes.data[0]);
            } else {
                // Create a default business if none exists
                const newBus = await api.post('/business', {
                    name: "My Awesome Business",
                    description: "A growing brand focused on delivering quality products and services.",
                    industry: "General",
                    target_audience: "General Public"
                });
                setBusiness(newBus.data);
            }
            const trendRes = await api.get('/trends');
            setTrends(trendRes.data.slice(0, 6));
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={{ color: 'white' }}>Loading Dashboard...</div>;

    return (
        <div className="home-page">
            <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ color: 'white', marginBottom: '0.5rem' }}>Welcome back, {business?.name || 'Marketer'}! 🚀</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Here's what's happening with your brand today.</p>
                </div>
                <div style={{
                    background: 'rgba(79, 70, 229, 0.1)',
                    border: '1px solid var(--primary)',
                    padding: '1rem 1.5rem',
                    borderRadius: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ color: 'white', fontWeight: 'bold', fontSize: '0.9rem' }}>Full Automation</div>
                        <div style={{ color: magicMessage ? '#10b981' : 'var(--text-secondary)', fontSize: '0.75rem' }}>
                            {magicMessage || (magicLoading ? 'Processing...' : 'AI-Pilot is ready')}
                        </div>
                    </div>
                    <button
                        onClick={runMagicAutomation}
                        disabled={magicLoading}
                        className="btn"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', minWidth: '120px' }}
                    >
                        {magicLoading ? '🪄 ...' : 'Run Magic ⚡'}
                    </button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                {/* Left Column: Viral Doctor & Newsjacking */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <ViralDoctor />
                    <Newsjacking businessId={business?.id} />
                </div>

                {/* Right Column: Trends & Competitors */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                    <div className="card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                            <TrendingUp color="var(--primary)" />
                            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Real-time Trends</h2>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                            {trends.map((trend, i) => (
                                <span key={i} style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '2rem',
                                    fontSize: '0.85rem',
                                    color: 'white',
                                    border: '1px solid var(--border-light)'
                                }}>
                                    #{trend}
                                </span>
                            ))}
                        </div>
                    </div>

                    <CompetitorSpy businessId={business?.id} />
                </div>
            </div>

            <div style={{ marginTop: '2.5rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                    <Target size={32} color="#4F46E5" style={{ marginBottom: '1rem' }} />
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>Focus Audience</h4>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{business?.target_audience || 'All users'}</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                    <Award size={32} color="#10B981" style={{ marginBottom: '1rem' }} />
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>Brand Tone</h4>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Professional & Engaging</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                    <TrendingUp size={32} color="#EC4899" style={{ marginBottom: '1rem' }} />
                    <h4 style={{ margin: '0 0 0.5rem 0' }}>Daily Trend Hit</h4>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>85% Match</div>
                </div>
            </div>
        </div>
    );
};

export default Home;

