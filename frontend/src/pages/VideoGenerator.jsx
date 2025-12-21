import React, { useState, useEffect } from 'react';
import api from '../api';
import { Video, Sparkles, Share2, Download, Loader2 } from 'lucide-react';

// Determine if we're in production or development
const isProduction = window.location.hostname !== 'localhost';
const API_BASE_URL = isProduction
    ? 'https://automarketer-backend-2mz4.onrender.com'
    : 'http://localhost:8000';
const VideoGenerator = () => {
    const [business, setBusiness] = useState(null);
    const [topic, setTopic] = useState('');
    const [numImages, setNumImages] = useState(4);
    const [loading, setLoading] = useState(false);
    const [posting, setPosting] = useState(false);
    const [videoData, setVideoData] = useState(null);
    const [error, setError] = useState(null);
    const [postStatus, setPostStatus] = useState(null);
    const [selectedPlatforms, setSelectedPlatforms] = useState(['twitter', 'linkedin', 'instagram']);

    const PLATFORMS = [
        { id: 'twitter', name: 'Twitter', icon: '🐦' },
        { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
        { id: 'instagram', name: 'Instagram', icon: '📸' },
    ];

    useEffect(() => {
        api.get('/businesses').then(res => {
            if (res.data.length > 0) setBusiness(res.data[0]);
        }).catch(console.error);
    }, []);

    const generateVideo = async () => {
        setLoading(true);
        setError(null);
        setVideoData(null);
        setPostStatus(null);

        try {
            const res = await api.post('/video/full-post', {
                business_id: business?.id,
                topic: topic,
                num_images: numImages
            });

            if (res.data.success) {
                setVideoData({
                    ...res.data,
                    video_url: `${API_BASE_URL}${res.data.video_url}`,
                    audio_url: `${API_BASE_URL}${res.data.audio_url}`
                });
            } else {
                setError(res.data.error || 'Video generation failed');
            }
        } catch (e) {
            setError(e.response?.data?.error || e.message);
        }

        setLoading(false);
    };

    const postToAllPlatforms = async () => {
        if (!videoData) return;

        setPosting(true);
        setPostStatus(null);

        try {
            const res = await api.post('/video/post-to-platforms', {
                video_url: videoData.video_url,
                caption: videoData.caption,
                platforms: selectedPlatforms
            });

            setPostStatus({
                success: res.data.success,
                message: res.data.message
            });
        } catch (e) {
            setPostStatus({
                success: false,
                message: e.response?.data?.error || e.message
            });
        }

        setPosting(false);
    };

    const togglePlatform = (platformId) => {
        setSelectedPlatforms(prev =>
            prev.includes(platformId)
                ? prev.filter(p => p !== platformId)
                : [...prev, platformId]
        );
    };

    return (
        <div>
            <h1 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Video size={28} /> Video Generator
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Create TikTok/Reels style videos with multiple AI-generated images, narration, and captions.
            </p>

            {/* Generator Form */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={20} /> Generate New Video
                </h3>

                <div className="input-group">
                    <label>Topic / Theme (Optional)</label>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., New Product Launch, Winter Sale, Behind the Scenes"
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem',
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid var(--border-light)',
                            borderRadius: '0.5rem',
                            color: 'white',
                            fontSize: '0.95rem'
                        }}
                    />
                </div>

                <div className="input-group" style={{ marginTop: '1rem' }}>
                    <label>Number of Images (Slides)</label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {[3, 4, 5, 6].map(n => (
                            <button
                                key={n}
                                onClick={() => setNumImages(n)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: numImages === n ? 'rgba(99, 102, 241, 0.3)' : 'rgba(255,255,255,0.05)',
                                    border: `1px solid ${numImages === n ? '#6366f1' : 'var(--border-light)'}`,
                                    borderRadius: '0.5rem',
                                    color: numImages === n ? '#a5b4fc' : 'var(--text-secondary)',
                                    cursor: 'pointer'
                                }}
                            >
                                {n} slides
                            </button>
                        ))}
                    </div>
                </div>

                {business && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '0.5rem',
                        fontSize: '0.85rem'
                    }}>
                        📊 Using business: <strong>{business.name}</strong> ({business.industry || 'General'})
                    </div>
                )}

                <button
                    onClick={generateVideo}
                    disabled={loading}
                    className="primary-button"
                    style={{
                        marginTop: '1.5rem',
                        width: '100%',
                        padding: '1rem',
                        fontSize: '1rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}
                >
                    {loading ? (
                        <>
                            <Loader2 size={20} className="spin" /> Generating Video (this may take 30-60 seconds)...
                        </>
                    ) : (
                        <>
                            <Video size={20} /> Generate Video 🎬
                        </>
                    )}
                </button>

                {error && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid #ef4444',
                        borderRadius: '0.5rem',
                        color: '#ef4444'
                    }}>
                        ❌ {error}
                    </div>
                )}
            </div>

            {/* Generated Video Display */}
            {videoData && (
                <div className="card">
                    <h3 style={{ margin: '0 0 1rem 0' }}>🎬 Generated Video</h3>

                    {/* Video Player */}
                    <video
                        controls
                        src={videoData.video_url}
                        style={{
                            width: '100%',
                            maxHeight: '400px',
                            borderRadius: '0.75rem',
                            background: '#000',
                            marginBottom: '1rem'
                        }}
                    />

                    {/* Caption Preview */}
                    <div style={{
                        padding: '1rem',
                        background: 'rgba(0,0,0,0.2)',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem'
                    }}>
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                            📝 Caption & Hashtags:
                        </label>
                        <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{videoData.caption}</p>
                    </div>

                    {/* Script Preview */}
                    <details style={{ marginBottom: '1rem' }}>
                        <summary style={{ cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            🎙️ View Narration Script
                        </summary>
                        <div style={{
                            marginTop: '0.5rem',
                            padding: '1rem',
                            background: 'rgba(139, 92, 246, 0.1)',
                            borderRadius: '0.5rem',
                            fontSize: '0.9rem'
                        }}>
                            {videoData.script}
                        </div>
                    </details>

                    {/* Image Previews */}
                    {videoData.image_urls && videoData.image_urls.length > 0 && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                                🖼️ Slideshow Images:
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', padding: '0.5rem 0' }}>
                                {videoData.image_urls.map((url, i) => (
                                    <img
                                        key={i}
                                        src={url}
                                        alt={`Slide ${i + 1}`}
                                        style={{
                                            width: '120px',
                                            height: '120px',
                                            objectFit: 'cover',
                                            borderRadius: '0.5rem',
                                            flexShrink: 0
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Platform Selection */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.5rem' }}>
                            Select platforms to post:
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {PLATFORMS.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => togglePlatform(p.id)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: selectedPlatforms.includes(p.id) ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                                        border: `1px solid ${selectedPlatforms.includes(p.id) ? '#10b981' : 'var(--border-light)'}`,
                                        borderRadius: '0.5rem',
                                        color: selectedPlatforms.includes(p.id) ? '#10b981' : 'var(--text-secondary)',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {p.icon} {p.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                        <button
                            onClick={postToAllPlatforms}
                            disabled={posting || selectedPlatforms.length === 0}
                            style={{
                                flex: 1,
                                padding: '0.75rem 1.5rem',
                                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                border: 'none',
                                borderRadius: '0.5rem',
                                color: 'white',
                                fontWeight: '600',
                                cursor: posting ? 'wait' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Share2 size={18} />
                            {posting ? 'Posting...' : `Post to ${selectedPlatforms.length} Platform(s)`}
                        </button>

                        <a
                            href={videoData.video_url}
                            download
                            style={{
                                padding: '0.75rem 1.5rem',
                                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                                border: 'none',
                                borderRadius: '0.5rem',
                                color: 'white',
                                fontWeight: '600',
                                textDecoration: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            <Download size={18} /> Download Video
                        </a>
                    </div>

                    {postStatus && (
                        <div style={{
                            marginTop: '1rem',
                            padding: '0.75rem',
                            background: postStatus.success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            border: `1px solid ${postStatus.success ? '#10b981' : '#ef4444'}`,
                            borderRadius: '0.5rem',
                            color: postStatus.success ? '#10b981' : '#ef4444'
                        }}>
                            {postStatus.success ? '✅' : '❌'} {postStatus.message}
                        </div>
                    )}
                </div>
            )}

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

export default VideoGenerator;
