import React from 'react';
import api from '../api';
import socialShare from '../utils/socialShare';

// Determine if we're in production or development
const isProduction = window.location.hostname !== 'localhost';
const API_BASE_URL = isProduction
    ? 'https://automarketer-backend-2mz4.onrender.com'
    : 'http://localhost:8000';
const PLATFORMS = [
    { id: 'twitter', name: 'Twitter', icon: '🐦' },
    { id: 'linkedin', name: 'LinkedIn', icon: '💼' },
    { id: 'instagram', name: 'Instagram', icon: '📸' },
    { id: 'email', name: 'Email', icon: '📧' },
];

const PostCard = ({ post, onDelete }) => {
    const [analysis, setAnalysis] = React.useState(null);
    const [community, setCommunity] = React.useState(null);
    // Initialize from database if available
    const [audioUrl, setAudioUrl] = React.useState(post.audio_url || null);
    const [videoUrl, setVideoUrl] = React.useState(post.video_url || null);
    const [deleted, setDeleted] = React.useState(false);
    const [loading, setLoading] = React.useState({ analysis: false, community: false, audio: false, video: false, publish: false, schedule: false, delete: false });
    const [publishStatus, setPublishStatus] = React.useState(null);
    const [selectedPlatforms, setSelectedPlatforms] = React.useState(['twitter', 'linkedin', 'instagram']);
    const [showMultiPost, setShowMultiPost] = React.useState(false);

    // Save video/audio URL to database when generated
    const saveMediaToPost = async (mediaType, url) => {
        try {
            await api.patch(`/content/${post.id}`, { [mediaType]: url });
            console.log(`✅ Saved ${mediaType} to post ${post.id}`);
        } catch (e) {
            console.error(`Failed to save ${mediaType}:`, e);
        }
    };

    // Delete post from history
    const deletePost = async () => {
        if (!confirm('Are you sure you want to delete this post?')) return;

        setLoading(prev => ({ ...prev, delete: true }));
        try {
            await api.delete(`/content/${post.id}`);
            setDeleted(true);
            if (onDelete) onDelete(post.id);
        } catch (e) {
            alert('Failed to delete: ' + (e.response?.data?.error || e.message));
        } finally {
            setLoading(prev => ({ ...prev, delete: false }));
        }
    };

    // Don't render if deleted
    if (deleted) return null;

    // Toggle platform selection
    const togglePlatform = (platformId) => {
        setSelectedPlatforms(prev =>
            prev.includes(platformId)
                ? prev.filter(p => p !== platformId)
                : [...prev, platformId]
        );
    };

    // Post to ALL selected platforms at once
    const publishToAllPlatforms = async () => {
        if (selectedPlatforms.length === 0) {
            setPublishStatus({ success: false, message: '❌ Please select at least one platform' });
            return;
        }

        setLoading({ ...loading, publish: true });
        setPublishStatus(null);

        const results = [];

        // Handle email separately - send to all saved recipients
        if (selectedPlatforms.includes('email')) {
            const savedEmails = JSON.parse(localStorage.getItem('automarketer_email_list') || '[]');
            if (savedEmails.length === 0) {
                results.push({ platform: 'email', result: { success: false, error: 'No email recipients saved. Go to Email List to add them.' } });
            } else {
                // Send to all emails
                for (const recipient of savedEmails) {
                    try {
                        await api.post('/publish', {
                            platform: 'email',
                            content: post.content,
                            recipient: recipient,
                            subject: 'Marketing Update from AutoMarketer'
                        });
                    } catch (e) {
                        // Continue even if one fails
                    }
                }
                results.push({ platform: 'email', result: { success: true, message: `Sent to ${savedEmails.length} recipients` } });
            }
        }

        // Handle social platforms
        const socialPlatforms = selectedPlatforms.filter(p => p !== 'email');
        if (socialPlatforms.length > 0) {
            try {
                const res = await api.post('/scheduler/post-now', {
                    content: post.content,
                    platforms: socialPlatforms,
                    image_url: post.image_url
                });

                if (res.data.data && Array.isArray(res.data.data)) {
                    results.push(...res.data.data);
                } else if (res.data.success) {
                    socialPlatforms.forEach(p => results.push({ platform: p, result: { success: true } }));
                } else {
                    socialPlatforms.forEach(p => results.push({ platform: p, result: { success: false, error: res.data.error } }));
                }
            } catch (e) {
                socialPlatforms.forEach(p => results.push({ platform: p, result: { success: false, error: e.message } }));
            }
        }

        // Show results
        const succeeded = results.filter(r => r.result?.success);
        const failed = results.filter(r => !r.result?.success);

        if (failed.length === 0) {
            setPublishStatus({
                success: true,
                message: `✅ Posted to all ${succeeded.length} platform(s)!`
            });
        } else if (succeeded.length > 0) {
            const failedMsg = failed.map(f => f.platform).join(', ');
            setPublishStatus({
                success: false,
                message: `⚠️ ${succeeded.length}/${results.length} posted. Failed: ${failedMsg}`
            });
        } else {
            // All failed - show specific error for first failure
            const firstError = failed[0]?.result?.error || 'Check connections.';
            setPublishStatus({
                success: false,
                message: `❌ ${failed[0]?.platform}: ${firstError}`
            });
        }

        setLoading({ ...loading, publish: false });
        setTimeout(() => setPublishStatus(null), 12000);
    };

    // Schedule for ALL selected platforms based on peak hours
    const scheduleToAllPlatforms = async () => {
        if (selectedPlatforms.length === 0) {
            setPublishStatus({ success: false, message: '❌ Please select at least one platform' });
            return;
        }

        setLoading({ ...loading, schedule: true });
        setPublishStatus(null);

        try {
            const res = await api.post('/scheduler/schedule', {
                content: post.content,
                platforms: selectedPlatforms,
                image_url: post.image_url
            });

            if (res.data.success) {
                setPublishStatus({
                    success: true,
                    message: `🕐 Scheduled for ${selectedPlatforms.length} platforms at peak hours!`
                });
            } else {
                setPublishStatus({
                    success: false,
                    message: `❌ ${res.data.error || 'Scheduling failed'}`
                });
            }
        } catch (e) {
            setPublishStatus({
                success: false,
                message: `❌ API Error: ${e.response?.data?.error || e.message}`
            });
        }

        setLoading({ ...loading, schedule: false });
        setTimeout(() => setPublishStatus(null), 8000);
    };

    // One-click publish to single platform via API
    const publishToSocial = async () => {
        const platform = post.platform.toLowerCase();

        // Email needs recipient
        if (platform === 'email') {
            const recipient = prompt('Enter recipient email address:');
            if (!recipient) return;

            setLoading({ ...loading, publish: true });
            setPublishStatus(null);

            try {
                const res = await api.post('/publish', {
                    platform: 'email',
                    content: post.content,
                    recipient: recipient,
                    subject: 'Marketing Update from AutoMarketer'
                });

                if (res.data.success) {
                    setPublishStatus({ success: true, message: `✅ Email sent to ${recipient}!` });
                } else {
                    socialShare.shareTo('email', post.content, post.image_url);
                    setPublishStatus({ success: true, message: `📧 Opening email client for ${recipient}...` });
                }
            } catch (e) {
                socialShare.shareTo('email', post.content, post.image_url);
                setPublishStatus({ success: true, message: `📧 Opening email client...` });
            }

            setLoading({ ...loading, publish: false });
            setTimeout(() => setPublishStatus(null), 8000);
            return;
        }

        // Blog needs title
        if (platform === 'blog') {
            const title = prompt('Enter blog post title:', 'AutoMarketer Post');
            if (!title) return;

            setLoading({ ...loading, publish: true });
            setPublishStatus(null);

            try {
                const res = await api.post('/scheduler/post-now', {
                    content: post.content,
                    platforms: ['blog'],
                    image_url: post.image_url,
                    title: title
                });

                if (res.data.success) {
                    setPublishStatus({ success: true, message: `✅ Posted to Blog!` });
                } else {
                    navigator.clipboard.writeText(post.content);
                    window.open('https://www.blogger.com/blog/post/edit/5826970573982375335', '_blank');
                    setPublishStatus({ success: true, message: `📝 Content copied! Blogger is opening.` });
                }
            } catch (e) {
                navigator.clipboard.writeText(post.content);
                window.open('https://www.blogger.com/blog/post/edit/5826970573982375335', '_blank');
                setPublishStatus({ success: true, message: `📝 Content copied! Blogger is opening.` });
            }

            setLoading({ ...loading, publish: false });
            setTimeout(() => setPublishStatus(null), 8000);
            return;
        }

        // Social media (Twitter, LinkedIn, Instagram, Facebook)
        setLoading({ ...loading, publish: true });
        setPublishStatus(null);

        try {
            const res = await api.post('/scheduler/post-now', {
                content: post.content,
                platforms: [platform],
                image_url: post.image_url
            });

            if (res.data.success) {
                setPublishStatus({
                    success: true,
                    message: `✅ Posted to ${post.platform} via API!`
                });
            } else {
                setPublishStatus({
                    success: false,
                    message: `❌ ${res.data.error || 'Publishing failed'}`
                });
            }
        } catch (e) {
            setPublishStatus({
                success: false,
                message: `❌ API Error: ${e.response?.data?.error || e.message}`
            });
        }

        setLoading({ ...loading, publish: false });
        setTimeout(() => setPublishStatus(null), 8000);
    };

    const runViralDoctor = async () => {
        setLoading({ ...loading, analysis: true });
        try {
            const res = await api.post('/viral-doctor', { content: post.content });
            setAnalysis(res.data);
        } catch (e) { console.error(e); }
        setLoading({ ...loading, analysis: false });
    };

    const runCommunityManager = async () => {
        setLoading({ ...loading, community: true });
        try {
            const res = await api.post('/community', { content: post.content });
            setCommunity(res.data);
        } catch (e) { console.error(e); }
        setLoading({ ...loading, community: false });
    };

    const generateAudio = async () => {
        setLoading({ ...loading, audio: true });
        try {
            const res = await api.post('/audio', { text: post.content, business_id: post.business_id });
            setAudioUrl(`${API_BASE_URL}/api/audio/${res.data.filename}`);
        } catch (e) { console.error(e); }
        setLoading({ ...loading, audio: false });
    };

    const generateVideo = async () => {
        if (!post.image_url) {
            alert('This post needs an image to create a video. Generate AI Image first.');
            return;
        }
        setLoading({ ...loading, video: true });
        try {
            const res = await api.post('/video/from-content', {
                text: post.content,
                image_url: post.image_url
            });
            if (res.data.success) {
                const fullVideoUrl = `${API_BASE_URL}${res.data.video_url}`;
                const fullAudioUrl = `${API_BASE_URL}${res.data.audio_url}`;

                setVideoUrl(fullVideoUrl);
                setAudioUrl(fullAudioUrl);

                // Save to database so it persists after page reload
                await saveMediaToPost('video_url', fullVideoUrl);
                await saveMediaToPost('audio_url', fullAudioUrl);
                console.log('✅ Video saved to post!');
            } else {
                alert('Video generation failed: ' + (res.data.error || 'Unknown error'));
            }
        } catch (e) {
            console.error(e);
            alert('Video generation failed: ' + (e.response?.data?.error || e.message));
        }
        setLoading({ ...loading, video: false });
    };

    return (
        <div className="card">
            {/* Header Row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                {/* Left: Platform & Model badges */}
                <span style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#60a5fa',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.875rem'
                }}>
                    {post.platform}
                </span>
                {post.model && (
                    <span style={{
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#34d399',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                    }}>
                        🤖 {post.model}
                    </span>
                )}

                {/* Spacer */}
                <div style={{ flex: 1 }}></div>

                {/* Right: Date & Delete */}
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    {new Date(post.created_at).toLocaleString('en-IN', {
                        timeZone: 'Asia/Kolkata',
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                    })}
                </span>
                <button
                    onClick={deletePost}
                    disabled={loading.delete}
                    style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#6b7280',
                        padding: '0.35rem',
                        borderRadius: '0.25rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'color 0.2s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.color = '#ef4444'}
                    onMouseOut={(e) => e.currentTarget.style.color = '#6b7280'}
                    title="Delete post"
                >
                    {loading.delete ? (
                        <span style={{ width: 16, height: 16, display: 'inline-block' }}>○</span>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    )}
                </button>
            </div>
            {post.image_url && (
                <div style={{ margin: '1rem 0', borderRadius: '0.75rem', overflow: 'hidden', height: '250px' }}>
                    <img src={post.image_url} alt="Generated Content" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
            )}
            <p style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{post.content}</p>

            {audioUrl && (
                <div style={{ margin: '1rem 0' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>🎙️ Audio:</label>
                    <audio controls src={audioUrl} style={{ width: '100%' }} />
                </div>
            )}

            {videoUrl && (
                <div style={{ margin: '1rem 0' }}>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>🎬 Generated Video:</label>
                    <video
                        controls
                        src={videoUrl}
                        style={{
                            width: '100%',
                            borderRadius: '0.75rem',
                            background: '#000'
                        }}
                    />
                    <a
                        href={videoUrl}
                        download
                        style={{
                            display: 'inline-block',
                            marginTop: '0.5rem',
                            padding: '0.5rem 1rem',
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            color: 'white',
                            textDecoration: 'none',
                            borderRadius: '0.5rem',
                            fontSize: '0.85rem'
                        }}
                    >
                        ⬇️ Download Video
                    </a>
                </div>
            )}

            {/* Multi-Platform Posting Section */}
            <div style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>
                {/* Toggle Multi-Platform Mode */}
                <button
                    onClick={() => setShowMultiPost(!showMultiPost)}
                    style={{
                        width: '100%',
                        padding: '0.5rem',
                        background: showMultiPost ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                        color: showMultiPost ? '#10b981' : 'var(--text-secondary)',
                        border: `1px solid ${showMultiPost ? '#10b981' : 'var(--border-light)'}`,
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.85rem',
                        marginBottom: '0.75rem'
                    }}
                >
                    {showMultiPost ? '✅ Multi-Platform Mode Active' : '🌐 Post to Multiple Platforms'}
                </button>

                {showMultiPost && (
                    <div style={{
                        padding: '1rem',
                        background: 'rgba(79, 70, 229, 0.1)',
                        borderRadius: '0.75rem',
                        marginBottom: '0.75rem'
                    }}>
                        {/* Platform Checkboxes */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                            {PLATFORMS.map(platform => (
                                <button
                                    key={platform.id}
                                    onClick={() => togglePlatform(platform.id)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: selectedPlatforms.includes(platform.id)
                                            ? 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)'
                                            : 'rgba(255, 255, 255, 0.1)',
                                        color: 'white',
                                        border: selectedPlatforms.includes(platform.id)
                                            ? 'none'
                                            : '1px solid var(--border-light)',
                                        borderRadius: '2rem',
                                        cursor: 'pointer',
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {platform.icon} {platform.name}
                                </button>
                            ))}
                        </div>

                        {/* Action Buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                onClick={publishToAllPlatforms}
                                disabled={loading.publish || selectedPlatforms.length === 0}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    background: loading.publish ? 'rgba(99, 102, 241, 0.5)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: loading.publish ? 'wait' : 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem'
                                }}
                            >
                                {loading.publish ? '⏳ Posting...' : `🚀 Post Now (${selectedPlatforms.length})`}
                            </button>
                            <button
                                onClick={scheduleToAllPlatforms}
                                disabled={loading.schedule || selectedPlatforms.length === 0}
                                style={{
                                    flex: 1,
                                    padding: '0.75rem',
                                    background: loading.schedule ? 'rgba(99, 102, 241, 0.5)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    cursor: loading.schedule ? 'wait' : 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem'
                                }}
                            >
                                {loading.schedule ? '⏳ Scheduling...' : `🕐 Schedule Peak (${selectedPlatforms.length})`}
                            </button>
                        </div>
                    </div>
                )}

                {/* Single Platform Publish Button */}
                <button
                    onClick={publishToSocial}
                    disabled={loading.publish}
                    style={{
                        width: '100%',
                        padding: '1rem',
                        background: loading.publish ? 'rgba(99, 102, 241, 0.5)' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.75rem',
                        cursor: loading.publish ? 'wait' : 'pointer',
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        transition: 'transform 0.2s'
                    }}
                    onMouseOver={(e) => { if (!loading.publish) e.target.style.transform = 'translateY(-2px)'; }}
                    onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                >
                    {loading.publish ? '⏳ Posting via API...' : `📤 Publish to ${post.platform}`}
                </button>

                {/* Publish Status Feedback */}
                {publishStatus && (
                    <div style={{
                        marginTop: '0.5rem',
                        padding: '0.75rem',
                        borderRadius: '0.5rem',
                        background: publishStatus.success ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        border: `1px solid ${publishStatus.success ? '#10b981' : '#ef4444'}`,
                        color: publishStatus.success ? '#10b981' : '#ef4444',
                        fontSize: '0.85rem',
                        textAlign: 'center'
                    }}>
                        {publishStatus.message}
                    </div>
                )}
            </div>

            <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
                marginTop: '1rem'
            }}>
                {/* Copy Button */}
                <button
                    onClick={() => {
                        navigator.clipboard.writeText(post.content);
                        alert('✅ Copied to clipboard!');
                    }}
                    style={{
                        padding: '0.5rem 0.9rem',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontWeight: '500',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s'
                    }}
                    onMouseOver={(e) => { e.target.style.background = 'rgba(255, 255, 255, 0.1)'; e.target.style.borderColor = 'var(--accent-primary)'; }}
                    onMouseOut={(e) => { e.target.style.background = 'rgba(255, 255, 255, 0.06)'; e.target.style.borderColor = 'var(--border-light)'; }}
                >
                    📋 Copy
                </button>

                {/* Viral Doctor Button */}
                <button
                    onClick={runViralDoctor}
                    disabled={loading.analysis}
                    style={{
                        padding: '0.5rem 0.9rem',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '0.5rem',
                        cursor: loading.analysis ? 'wait' : 'pointer',
                        fontWeight: '500',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s',
                        opacity: loading.analysis ? 0.6 : 1
                    }}
                    onMouseOver={(e) => { if (!loading.analysis) { e.target.style.background = 'rgba(255, 255, 255, 0.1)'; e.target.style.borderColor = 'var(--accent-primary)'; } }}
                    onMouseOut={(e) => { e.target.style.background = 'rgba(255, 255, 255, 0.06)'; e.target.style.borderColor = 'var(--border-light)'; }}
                >
                    🩺 {loading.analysis ? 'Analyzing...' : 'Viral Doctor'}
                </button>

                {/* Community Button */}
                <button
                    onClick={runCommunityManager}
                    disabled={loading.community}
                    style={{
                        padding: '0.5rem 0.9rem',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '0.5rem',
                        cursor: loading.community ? 'wait' : 'pointer',
                        fontWeight: '500',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s',
                        opacity: loading.community ? 0.6 : 1
                    }}
                    onMouseOver={(e) => { if (!loading.community) { e.target.style.background = 'rgba(255, 255, 255, 0.1)'; e.target.style.borderColor = 'var(--accent-primary)'; } }}
                    onMouseOut={(e) => { e.target.style.background = 'rgba(255, 255, 255, 0.06)'; e.target.style.borderColor = 'var(--border-light)'; }}
                >
                    👥 {loading.community ? 'Simulating...' : 'Community'}
                </button>

                {/* Audio Studio Button */}
                <button
                    onClick={generateAudio}
                    disabled={loading.audio}
                    style={{
                        padding: '0.5rem 0.9rem',
                        background: 'rgba(255, 255, 255, 0.06)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '0.5rem',
                        cursor: loading.audio ? 'wait' : 'pointer',
                        fontWeight: '500',
                        fontSize: '0.8rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.2s',
                        opacity: loading.audio ? 0.6 : 1
                    }}
                    onMouseOver={(e) => { if (!loading.audio) { e.target.style.background = 'rgba(255, 255, 255, 0.1)'; e.target.style.borderColor = 'var(--accent-primary)'; } }}
                    onMouseOut={(e) => { e.target.style.background = 'rgba(255, 255, 255, 0.06)'; e.target.style.borderColor = 'var(--border-light)'; }}
                >
                    🎙️ {loading.audio ? 'Converting...' : 'Audio'}
                </button>

                {/* Create Video Button */}
                {post.image_url && (
                    <button
                        onClick={generateVideo}
                        disabled={loading.video}
                        style={{
                            padding: '0.5rem 0.9rem',
                            background: loading.video ? 'rgba(139, 92, 246, 0.3)' : 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: loading.video ? 'wait' : 'pointer',
                            fontWeight: '600',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            transition: 'all 0.2s'
                        }}
                    >
                        🎬 {loading.video ? 'Creating Video...' : 'Create Video'}
                    </button>
                )}

                {/* Download Button */}
                {post.image_url && (
                    <button
                        onClick={() => {
                            const link = document.createElement('a');
                            link.href = post.image_url;
                            link.download = `generated_image_${post.id}.jpg`;
                            link.click();
                        }}
                        style={{
                            padding: '0.5rem 0.9rem',
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-light)',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: '500',
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => { e.target.style.background = 'rgba(255, 255, 255, 0.1)'; e.target.style.borderColor = 'var(--accent-primary)'; }}
                        onMouseOut={(e) => { e.target.style.background = 'rgba(255, 255, 255, 0.06)'; e.target.style.borderColor = 'var(--border-light)'; }}
                    >
                        🖼️ Download
                    </button>
                )}
            </div>

            {analysis && (
                <div className="card" style={{ background: 'rgba(52, 211, 153, 0.1)', marginTop: '1rem', border: '1px solid #059669' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h4 style={{ margin: 0 }}>Viral Analysis</h4>
                        <span style={{ fontWeight: 'bold', color: '#34d399' }}>Score: {analysis.score}</span>
                    </div>
                    <ul style={{ fontSize: '0.85rem', marginTop: '0.5rem' }}>
                        {analysis.recommendations?.map((rec, i) => <li key={i}>{rec}</li>)}
                    </ul>
                </div>
            )}

            {community && (
                <div className="card" style={{ background: 'rgba(251, 191, 36, 0.1)', marginTop: '1rem', border: '1px solid #d97706' }}>
                    <h4 style={{ margin: 0, marginBottom: '0.5rem' }}>Community Simulation</h4>
                    {community.map((item, i) => (
                        <div key={i} style={{ marginBottom: '0.5rem', fontSize: '0.85rem', borderBottom: i < community.length - 1 ? '1px solid rgba(255,255,255,0.1)' : 'none', paddingBottom: '0.5rem' }}>
                            <div style={{ color: '#fbbf24' }}><strong>{item.user}:</strong> {item.comment}</div>
                            <div style={{ marginTop: '0.25rem', opacity: 0.9 }}><strong>Reply:</strong> {item.brand_reply}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PostCard;

