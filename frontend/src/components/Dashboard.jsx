import React, { useEffect, useState } from 'react';
import api from '../api';
import ContentGenerator from './ContentGenerator';
import PostCard from './PostCard';
import CampaignGenerator from './CampaignGenerator';
import Newsjacking from './Newsjacking';
import CompetitorSpy from './CompetitorSpy';

import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
    const { logout, user } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(true);

    // Hardcoded business ID removed
    // const BUSINESS_ID = 1;

    useEffect(() => {
        if (user) {
            fetchInitialData();
        }
    }, [user]);

    const fetchInitialData = async () => {
        try {
            // Fetch user's businesses - NO hardcoded defaults!
            let activeBusiness = null;
            try {
                const busRes = await api.get('/businesses');
                if (busRes.data && busRes.data.length > 0) {
                    activeBusiness = busRes.data[0];
                }
                // If no business exists, user needs to create one in Profile
                setBusiness(activeBusiness);
            } catch (e) {
                console.error("Error loading business context", e);
            }

            const contentRes = await api.get('/content');
            setPosts(contentRes.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };


    const handleNewPost = (post) => {
        setPosts([post, ...posts]);
    };

    if (loading) return <div className="container">Loading...</div>;

    return (
        <div className="container">
            <header className="header">
                <div className="logo">AutoMarketer 🤖</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 'bold' }}>{business?.name}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{user?.username}</div>
                    </div>
                    <button
                        onClick={() => { logout(); navigate('/login'); }}
                        style={{
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid var(--border-light)',
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            color: 'white',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        {t('headers.logout')}
                    </button>
                </div>
            </header>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                <div style={{ position: 'sticky', top: '2rem', height: 'fit-content' }}>
                    {!business ? (
                        <div className="card" style={{ marginBottom: '1rem', border: '1px solid #f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
                            <h3 style={{ color: '#f59e0b', margin: '0 0 0.5rem 0' }}>⚠️ {t('headers.setup')}</h3>
                            <p style={{ fontSize: '0.9rem', marginBottom: '1rem' }}>{t('headers.setupMessage')}</p>
                            <button
                                onClick={() => navigate('/profile')}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    background: '#f59e0b',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}
                            >
                                {t('headers.setupButton')}
                            </button>
                        </div>
                    ) : (
                        <>
                            <ContentGenerator businessId={business?.id} business={business} onGenerate={handleNewPost} />

                            <div className="card" style={{ marginTop: '1rem' }}>
                                <h3>{t('headers.context')}</h3>
                                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    {business?.description}
                                </p>
                                <div style={{ marginTop: '1rem' }}>
                                    <label style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>{t('generator.targetAudience')}</label>
                                    <div style={{ marginTop: '0.25rem' }}>{business?.target_audience}</div>
                                </div>
                            </div>
                        </>
                    )}

                    <div style={{ marginTop: '1rem', opacity: business ? 1 : 0.5, pointerEvents: business ? 'auto' : 'none' }}>
                        <CampaignGenerator businessId={business?.id} />
                    </div>

                    <div style={{ marginTop: '1rem', opacity: business ? 1 : 0.5, pointerEvents: business ? 'auto' : 'none' }}>
                        <Newsjacking businessId={business?.id} />
                    </div>

                    <div style={{ marginTop: '1rem', opacity: business ? 1 : 0.5, pointerEvents: business ? 'auto' : 'none' }}>
                        <CompetitorSpy businessId={business?.id} />
                    </div>
                </div>

                <div>
                    <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>{t('headers.recent')}</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {posts.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                No content generated yet. Start by creating your first post!
                            </div>
                        ) : (
                            posts.map(post => <PostCard key={post.id} post={post} />)
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
