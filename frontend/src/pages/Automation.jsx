import React, { useState, useEffect } from 'react';
import api from '../api';
import { Clock, Zap, Calendar, Power, TrendingUp } from 'lucide-react';

const Automation = () => {
    const [peakHours, setPeakHours] = useState({});
    const [scheduledPosts, setScheduledPosts] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [business, setBusiness] = useState(null);

    useEffect(() => {
        fetchPeakHours();
        fetchScheduledPosts();
        fetchBusiness();
    }, []);

    const fetchBusiness = async () => {
        try {
            const res = await api.get('/businesses');
            if (res.data.length > 0) {
                setBusiness(res.data[0]);
            }
        } catch (e) {
            console.error('Error fetching business:', e);
        }
    };

    const fetchPeakHours = async () => {
        try {
            const res = await api.get('/scheduler/peak-hours');
            setPeakHours(res.data.peak_hours);
        } catch (e) {
            console.error('Error fetching peak hours:', e);
        }
    };

    const fetchScheduledPosts = async () => {
        try {
            const res = await api.get('/scheduler/queue');
            setScheduledPosts(res.data.scheduled_posts || []);
        } catch (e) {
            console.error('Error fetching scheduled posts:', e);
        }
    };

    const autoPostTrending = async () => {
        if (!business) {
            setMessage({ type: 'error', text: 'No business profile found' });
            return;
        }

        setLoading(true);
        try {
            const res = await api.post(`/scheduler/auto-trending/${business.id}`, {
                platforms: ['twitter', 'linkedin']
            });

            if (res.data.success) {
                setMessage({ type: 'success', text: '✅ Trending posts generated and scheduled!' });
                fetchScheduledPosts();
            } else {
                setMessage({ type: 'error', text: res.data.error || 'Failed to generate posts' });
            }
        } catch (e) {
            setMessage({ type: 'error', text: e.response?.data?.error || 'Network error' });
        }
        setLoading(false);
    };

    const startAutomation = async () => {
        if (!business) {
            setMessage({ type: 'error', text: 'No business profile found' });
            return;
        }

        setLoading(true);
        try {
            const res = await api.post(`/scheduler/start/${business.id}`, {
                interval_hours: 4
            });

            if (res.data.success) {
                setIsRunning(true);
                setMessage({ type: 'success', text: '🚀 Auto-posting started! Posts every 4 hours during peak times.' });
            }
        } catch (e) {
            setMessage({ type: 'error', text: e.response?.data?.error || 'Failed to start automation' });
        }
        setLoading(false);
    };

    const stopAutomation = async () => {
        setLoading(true);
        try {
            const res = await api.post('/scheduler/stop');
            if (res.data.success) {
                setIsRunning(false);
                setMessage({ type: 'success', text: '⏹️ Auto-posting stopped.' });
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Failed to stop automation' });
        }
        setLoading(false);
    };

    return (
        <div>
            <h1 style={{ marginBottom: '0.5rem' }}>⚡ Automation Center</h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Automate your social media posts based on trending topics and peak hours
            </p>

            {message && (
                <div style={{
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    borderRadius: '0.75rem',
                    background: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
                    color: message.type === 'success' ? '#10b981' : '#ef4444'
                }}>
                    {message.text}
                </div>
            )}

            {/* Quick Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                    <TrendingUp size={32} style={{ color: 'var(--accent-primary)', marginBottom: '0.5rem' }} />
                    <h3 style={{ margin: '0.5rem 0' }}>Auto-Post Trending</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                        Generate posts based on current trends and schedule for peak hours
                    </p>
                    <button
                        onClick={autoPostTrending}
                        disabled={loading}
                        className="primary-button"
                        style={{ width: '100%' }}
                    >
                        {loading ? 'Generating...' : '🔥 Generate Trending Posts'}
                    </button>
                </div>

                <div className="card" style={{ textAlign: 'center', padding: '1.5rem' }}>
                    <Power size={32} style={{ color: isRunning ? '#10b981' : '#6b7280', marginBottom: '0.5rem' }} />
                    <h3 style={{ margin: '0.5rem 0' }}>Auto-Pilot Mode</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                        {isRunning ? 'Running - posts every 4 hours during peak times' : 'Start continuous auto-posting'}
                    </p>
                    <button
                        onClick={isRunning ? stopAutomation : startAutomation}
                        disabled={loading}
                        style={{
                            width: '100%',
                            padding: '0.75rem',
                            background: isRunning ? 'rgba(239, 68, 68, 0.2)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                            color: isRunning ? '#ef4444' : 'white',
                            border: isRunning ? '1px solid #ef4444' : 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: '600'
                        }}
                    >
                        {isRunning ? '⏹️ Stop Auto-Pilot' : '🚀 Start Auto-Pilot'}
                    </button>
                </div>
            </div>

            {/* Peak Hours Settings */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Clock size={20} /> Peak Hours by Platform
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 'normal' }}>
                        (click hours to edit)
                    </span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
                    {Object.entries(peakHours).map(([platform, hours]) => (
                        <div key={platform} style={{
                            padding: '1rem',
                            background: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: '0.5rem'
                        }}>
                            <strong style={{ textTransform: 'capitalize', display: 'block', marginBottom: '0.5rem' }}>
                                {platform}
                            </strong>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                                {[...Array(24)].map((_, hour) => (
                                    <button
                                        key={hour}
                                        onClick={async () => {
                                            const newHours = hours.includes(hour)
                                                ? hours.filter(h => h !== hour)
                                                : [...hours, hour].sort((a, b) => a - b);
                                            try {
                                                await api.put('/scheduler/peak-hours', {
                                                    platform: platform,
                                                    hours: newHours
                                                });
                                                fetchPeakHours();
                                                setMessage({ type: 'success', text: `✅ Updated ${platform} peak hours` });
                                            } catch (e) {
                                                setMessage({ type: 'error', text: 'Failed to update peak hours' });
                                            }
                                        }}
                                        style={{
                                            width: '32px',
                                            height: '28px',
                                            fontSize: '0.7rem',
                                            border: 'none',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            background: hours.includes(hour) ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                                            color: hours.includes(hour) ? 'white' : 'var(--text-secondary)'
                                        }}
                                    >
                                        {hour}
                                    </button>
                                ))}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.5rem' }}>
                                Active: {hours.length > 0 ? hours.map(h => `${h}:00`).join(', ') : 'None'}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Scheduled Posts */}
            <div className="card">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <Calendar size={20} /> Scheduled Posts Queue
                </h3>
                {scheduledPosts.length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>
                        No posts scheduled. Click "Generate Trending Posts" to schedule some!
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {scheduledPosts.map((post, i) => (
                            <div key={i} style={{
                                padding: '1rem',
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.9rem' }}>{post.content}</div>
                                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                                        {post.platforms?.join(', ')}
                                    </div>
                                </div>
                                <div style={{
                                    background: 'var(--accent-primary)',
                                    padding: '0.25rem 0.75rem',
                                    borderRadius: '1rem',
                                    fontSize: '0.75rem',
                                    whiteSpace: 'nowrap'
                                }}>
                                    {post.scheduled_time}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Automation;
