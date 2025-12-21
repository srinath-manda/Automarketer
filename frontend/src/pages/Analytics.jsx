import React, { useState, useEffect } from 'react';
import api from '../api';
import {
    BarChart3, TrendingUp, Users, Image, Video, Mic,
    Package, Building2, Calendar, Target, DollarSign,
    Loader2, RefreshCw
} from 'lucide-react';

const Analytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.get('/analytics/summary');
            if (res.data.success) {
                setAnalytics(res.data.analytics);
            }
        } catch (e) {
            setError(e.response?.data?.error || e.message);
        }
        setLoading(false);
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <Loader2 size={40} className="spin" style={{ color: '#8b5cf6' }} />
                <p style={{ color: 'var(--text-secondary)', marginTop: '1rem' }}>Loading analytics...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{ textAlign: 'center', padding: '3rem' }}>
                <p style={{ color: '#ef4444' }}>❌ {error}</p>
                <button onClick={fetchAnalytics} style={{ marginTop: '1rem', padding: '0.5rem 1rem' }}>
                    Try Again
                </button>
            </div>
        );
    }

    const stats = analytics || {};
    const platforms = stats.platforms || {};
    const media = stats.media_stats || {};
    const engagement = stats.engagement_estimate || {};

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <BarChart3 size={28} /> Analytics Dashboard 📊
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Track your content performance and engagement metrics.
                    </p>
                </div>
                <button
                    onClick={fetchAnalytics}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.25rem',
                        background: 'rgba(139, 92, 246, 0.2)',
                        border: '1px solid #8b5cf6',
                        borderRadius: '0.5rem',
                        color: '#8b5cf6',
                        cursor: 'pointer'
                    }}
                >
                    <RefreshCw size={18} /> Refresh
                </button>
            </div>

            {/* Key Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2rem' }}>
                <div className="card" style={{
                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.1))',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    textAlign: 'center',
                    padding: '1.5rem'
                }}>
                    <TrendingUp size={32} color="#10b981" style={{ marginBottom: '0.75rem' }} />
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#10b981' }}>
                        {stats.total_posts || 0}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Total Posts</div>
                </div>

                <div className="card" style={{
                    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(236, 72, 153, 0.1))',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    textAlign: 'center',
                    padding: '1.5rem'
                }}>
                    <Users size={32} color="#8b5cf6" style={{ marginBottom: '0.75rem' }} />
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                        {engagement.total_reach?.toLocaleString() || '0'}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Est. Total Reach</div>
                </div>

                <div className="card" style={{
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(249, 115, 22, 0.1))',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    textAlign: 'center',
                    padding: '1.5rem'
                }}>
                    <Target size={32} color="#f59e0b" style={{ marginBottom: '0.75rem' }} />
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#f59e0b' }}>
                        {engagement.avg_engagement_rate || 0}%
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Avg Engagement</div>
                </div>

                <div className="card" style={{
                    background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(16, 185, 129, 0.1))',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    textAlign: 'center',
                    padding: '1.5rem'
                }}>
                    <DollarSign size={32} color="#06b6d4" style={{ marginBottom: '0.75rem' }} />
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#06b6d4' }}>
                        {engagement.estimated_conversions || 0}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Est. Conversions</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                {/* Platform Distribution */}
                <div className="card">
                    <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart3 size={20} /> Platform Distribution
                    </h3>
                    {Object.keys(platforms).length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {Object.entries(platforms).map(([platform, count]) => {
                                const total = stats.total_posts || 1;
                                const percentage = Math.round((count / total) * 100);
                                const colors = {
                                    'Instagram': '#E4405F',
                                    'Twitter': '#1DA1F2',
                                    'LinkedIn': '#0A66C2',
                                    'Blog': '#FF5722',
                                    'Email': '#10b981'
                                };
                                const color = colors[platform] || '#8b5cf6';

                                return (
                                    <div key={platform}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                            <span>{platform}</span>
                                            <span style={{ color: 'var(--text-secondary)' }}>{count} posts ({percentage}%)</span>
                                        </div>
                                        <div style={{ height: '12px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px', overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${percentage}%`,
                                                height: '100%',
                                                background: `linear-gradient(90deg, ${color}, ${color}88)`,
                                                borderRadius: '6px',
                                                transition: 'width 0.5s ease'
                                            }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                            No posts yet. Generate some content to see analytics!
                        </div>
                    )}
                </div>

                {/* Media Stats */}
                <div className="card">
                    <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Image size={20} /> Media Stats
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1rem',
                            background: 'rgba(236, 72, 153, 0.1)',
                            borderRadius: '0.5rem'
                        }}>
                            <Image size={24} color="#ec4899" />
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{media.with_images || 0}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Posts with Images</div>
                            </div>
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1rem',
                            background: 'rgba(139, 92, 246, 0.1)',
                            borderRadius: '0.5rem'
                        }}>
                            <Video size={24} color="#8b5cf6" />
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{media.with_videos || 0}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Posts with Videos</div>
                            </div>
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '1rem',
                            background: 'rgba(6, 182, 212, 0.1)',
                            borderRadius: '0.5rem'
                        }}>
                            <Mic size={24} color="#06b6d4" />
                            <div>
                                <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>{media.with_audio || 0}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Posts with Audio</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Business Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '2rem' }}>
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                    <Building2 size={32} color="#8b5cf6" style={{ marginBottom: '1rem' }} />
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.businesses || 0}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>Businesses</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                    <Package size={32} color="#10b981" style={{ marginBottom: '1rem' }} />
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.products || 0}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>Products</div>
                </div>
                <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
                    <Calendar size={32} color="#f59e0b" style={{ marginBottom: '1rem' }} />
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{stats.posts_this_week || 0}</div>
                    <div style={{ color: 'var(--text-secondary)' }}>Posts This Week</div>
                </div>
            </div>

            <style>{`
                .spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default Analytics;
