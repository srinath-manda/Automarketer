import React, { useState, useEffect } from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

// Determine if we're in production or development
const isProduction = window.location.hostname !== 'localhost';
const API_BASE_URL = isProduction
    ? 'https://automarketer-backend-2mz4.onrender.com'
    : 'http://localhost:8000';
// Platform-specific limits and requirements
const PLATFORM_LIMITS = {
    'Twitter': { chars: 280, tags: 2, image: '1200x675', imageRequired: false, description: 'Short & punchy' },
    'LinkedIn': { chars: 3000, tags: 5, image: '1200x627', imageRequired: false, description: 'Professional & insightful' },
    'Instagram': { chars: 2200, tags: 30, image: '1080x1080', imageRequired: true, description: 'Visual-first, hashtag heavy' },
    'Video (TikTok/Reels)': { chars: 2200, tags: 10, image: '1080x1920', imageRequired: true, description: 'Vertical video with script' },
    'Email': { chars: 5000, tags: 0, image: '600x400', imageRequired: false, description: 'Personal & actionable' },
    'Blog': { chars: 10000, tags: 8, image: '1200x630', imageRequired: true, description: 'SEO-friendly long form' }
};

const ContentGenerator = ({ businessId, business, onGenerate }) => {
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [loadingStage, setLoadingStage] = useState(''); // Track generation stage
    const [platform, setPlatform] = useState('Twitter');
    const [topic, setTopic] = useState('');
    const [includeImage, setIncludeImage] = useState(false);
    const [includeAudio, setIncludeAudio] = useState(false);
    const [useMultiModel, setUseMultiModel] = useState(true);
    const [modelComparison, setModelComparison] = useState(null);
    const [generatedPost, setGeneratedPost] = useState(null); // NEW: Store result to show on page
    const [imageFile, setImageFile] = useState(null);
    const [trends, setTrends] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [language, setLanguage] = useState('English');
    const [selectedTrends, setSelectedTrends] = useState([]);
    const [autoTrends, setAutoTrends] = useState(false);
    const [customBusiness, setCustomBusiness] = useState({ name: '', industry: '', description: '', target_audience: '' });
    const [showBusinessDetails, setShowBusinessDetails] = useState(false);

    useEffect(() => {
        if (business) {
            setCustomBusiness({
                name: business.name || '',
                industry: business.industry || '',
                description: business.description || '',
                target_audience: business.target_audience || ''
            });
        }
    }, [business]);

    useEffect(() => {
        api.get('/trends').then(res => setTrends(res.data)).catch(console.error);
        if (businessId) {
            api.get(`/business/${businessId}/products`)
                .then(res => setProducts(res.data))
                .catch(console.error);
        }
    }, [businessId]);

    // Auto-enable image for video content
    useEffect(() => {
        if (platform === 'Video (TikTok/Reels)') {
            setIncludeImage(true);
            setIncludeAudio(true);
        }
    }, [platform]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setModelComparison(null);
        setLoadingStage('🔄 Connecting to AI models...');
        try {
            let finalPost;

            // Use multi-model generation if enabled
            if (useMultiModel) {
                setLoadingStage('🤖 Generating content with multiple AI models...');
                const response = await api.post('/generate-best', {
                    business_id: businessId,
                    platform: platform === 'Video (TikTok/Reels)' ? 'TikTok/Reels' : platform,
                    topic: `${topic}${selectedTrends.length > 0 ? ' ' + selectedTrends.join(' ') : ''}${autoTrends && selectedTrends.length === 0 ? ' ' + trends.slice(0, 5).join(' ') : ''}`,
                    include_image: includeImage,
                    language: language,
                    business_info: customBusiness
                });

                setLoadingStage('✅ Analyzing virality scores...');

                finalPost = {
                    id: response.data.content_id,
                    platform: platform,
                    content: response.data.content,
                    image_url: response.data.image_url,
                    model: response.data.best_model, // Which AI model generated this
                    virality_score: response.data.best_score,
                    created_at: new Date().toISOString()
                };

                // Save model comparison for display
                setModelComparison({
                    best_model: response.data.best_model,
                    best_score: response.data.best_score,
                    comparison: response.data.comparison
                });
            } else {
                // Use standard single-model generation
                const formData = new FormData();
                formData.append('business_id', businessId);
                formData.append('platform', platform === 'Video (TikTok/Reels)' ? 'TikTok/Reels' : platform);
                formData.append('topic', `${topic}${selectedTrends.length > 0 ? ' ' + selectedTrends.join(' ') : ''}${autoTrends && selectedTrends.length === 0 ? ' ' + trends.slice(0, 5).join(' ') : ''}`);
                formData.append('include_image', includeImage);
                formData.append('include_audio', includeAudio);
                formData.append('language', language);
                formData.append('business_info', JSON.stringify(customBusiness));
                if (selectedProduct) {
                    formData.append('product_ids', selectedProduct);
                }
                if (imageFile) {
                    formData.append('image', imageFile);
                }

                const textResponse = await api.post('/generate', formData);
                finalPost = textResponse.data;
            }

            // Generate Audio if requested
            if (includeAudio && finalPost.content) {
                try {
                    const audioRes = await api.post('/audio', {
                        text: finalPost.content,
                        business_id: businessId
                    });
                    if (audioRes.data.filename) {
                        finalPost.audio_url = `${API_BASE_URL}/api/audio/${audioRes.data.filename}`;
                    }
                } catch (e) {
                    console.log('Audio generation failed, continuing without audio');
                }
            }

            if (onGenerate) {
                onGenerate(finalPost);
            }
            // Store the result to display on this page instead of navigating away
            setGeneratedPost(finalPost);
            // Don't clear form or navigate - let user see results
            // User can click "View History" or "Generate New" button
            setIncludeImage(false);
            setIncludeAudio(false);
            setImageFile(null);
            setSelectedProduct('');
        } catch (error) {
            console.error('Error generating content:', error);
            alert('Failed to generate content: ' + (error.response?.data?.error || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card animate-fade-in" style={{ marginBottom: '2rem' }}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem' }}>✨</span> {t('generator.title')}
            </h2>
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label>{t('generator.product')}</label>
                    <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)}>
                        <option value="">{t('generator.allProducts')}</option>
                        {products.map(p => (
                            <option key={p.id} value={p.id}>
                                {p.name} {p.offers ? `(${p.offers})` : ''}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="input-group">
                        <label>{t('generator.platform')}</label>
                        <select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                            <option value="Instagram">Instagram</option>
                            <option value="LinkedIn">LinkedIn</option>
                            <option value="Twitter">Twitter</option>
                            <option value="Video (TikTok/Reels)">🎬 Video (TikTok/Reels)</option>
                            <option value="Email">Email Campaign</option>
                            <option value="Blog">Blog Post</option>
                        </select>
                        {/* Platform Requirements Info */}
                        <div style={{
                            marginTop: '0.5rem',
                            padding: '0.5rem 0.75rem',
                            background: 'rgba(59, 130, 246, 0.1)',
                            borderRadius: '0.375rem',
                            fontSize: '0.75rem',
                            color: '#93c5fd'
                        }}>
                            <div><strong>{PLATFORM_LIMITS[platform]?.description}</strong></div>
                            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
                                <span>📏 {PLATFORM_LIMITS[platform]?.chars} chars</span>
                                <span>🏷️ {PLATFORM_LIMITS[platform]?.tags} tags</span>
                                <span>🖼️ {PLATFORM_LIMITS[platform]?.image}</span>
                                {PLATFORM_LIMITS[platform]?.imageRequired && <span style={{ color: '#fbbf24' }}>⚠️ Image required</span>}
                            </div>
                        </div>
                    </div>

                    {/* Profile Setup Alert - Show if business profile is incomplete */}
                    {(!business?.name || !business?.description) && (
                        <div style={{
                            gridColumn: '1 / -1',
                            padding: '1rem',
                            background: 'rgba(245, 158, 11, 0.15)',
                            border: '1px solid rgba(245, 158, 11, 0.5)',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '1rem'
                        }}>
                            <div style={{ color: '#fbbf24', fontSize: '0.9rem' }}>
                                ⚠️ <strong>Complete your business profile</strong> to generate better targeted content!
                            </div>
                            <button
                                type="button"
                                onClick={() => navigate('/profile')}
                                style={{
                                    background: 'rgba(245, 158, 11, 0.3)',
                                    border: '1px solid #f59e0b',
                                    color: '#fbbf24',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '0.5rem',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem',
                                    fontWeight: '600',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                Setup Profile →
                            </button>
                        </div>
                    )}

                    <div className="input-group">
                        <label>{t('generator.language')}</label>
                        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                            <option value="English">English</option>
                            <option value="Hindi">Hindi (हिंदी)</option>
                            <option value="Tamil">Tamil (தமிழ்)</option>
                            <option value="Telugu">Telugu (తెలుగు)</option>
                            <option value="Marathi">Marathi (मराठी)</option>
                            <option value="Bengali">Bengali (বাংলা)</option>
                            <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                            <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                            <option value="Malayalam">Malayalam (മലയാളം)</option>
                            <option value="Spanish">Spanish</option>
                            <option value="French">French</option>
                            <option value="German">German</option>
                        </select>
                    </div>
                </div>

                <div className="input-group">
                    <label>{t('generator.topic')}</label>
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., Summer Sale, New Product Launch"
                    />
                </div>

                <div className="input-group">
                    <label>{t('generator.uploadImage')}</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files[0])}
                    />
                </div>

                <div style={{ display: 'flex', gap: '2rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                    <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: 0 }}>
                        <input
                            type="checkbox"
                            id="includeImage"
                            checked={includeImage}
                            onChange={(e) => setIncludeImage(e.target.checked)}
                            style={{ width: 'auto' }}
                        />
                        <label htmlFor="includeImage" style={{ marginBottom: 0, cursor: 'pointer' }}>{t('generator.generateImage')}</label>
                    </div>

                    <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: 0 }}>
                        <input
                            type="checkbox"
                            id="includeAudio"
                            checked={includeAudio}
                            onChange={(e) => setIncludeAudio(e.target.checked)}
                            style={{ width: 'auto' }}
                        />
                        <label htmlFor="includeAudio" style={{ marginBottom: 0, cursor: 'pointer' }}>{t('generator.generateAudio')}</label>
                    </div>

                    <div className="input-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: 0 }}>
                        <input
                            type="checkbox"
                            id="useMultiModel"
                            checked={useMultiModel}
                            onChange={(e) => setUseMultiModel(e.target.checked)}
                            style={{ width: 'auto' }}
                        />
                        <label htmlFor="useMultiModel" style={{ marginBottom: 0, cursor: 'pointer', color: '#10b981' }}>{t('generator.multiModel')}</label>
                    </div>
                </div>

                {/* Model Comparison Results */}
                {modelComparison && (
                    <div style={{
                        padding: '1rem',
                        background: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem',
                        border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}>
                        <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: '#10b981' }}>
                            🏆 Best Model: {modelComparison.best_model} (Score: {modelComparison.best_score}/100)
                        </div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                            Comparison: {modelComparison.comparison?.map(c =>
                                `${c.model}: ${c.score}`
                            ).join(' | ')}
                        </div>
                    </div>
                )}

                {/* Generated Content Preview */}
                {generatedPost && (
                    <div style={{
                        padding: '1rem',
                        background: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem',
                        border: '1px solid rgba(59, 130, 246, 0.3)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                            <span style={{ fontWeight: '600', color: '#60a5fa' }}>✅ Content Generated!</span>
                            {generatedPost.model && (
                                <span style={{
                                    background: 'rgba(16, 185, 129, 0.2)',
                                    color: '#34d399',
                                    padding: '0.2rem 0.5rem',
                                    borderRadius: '1rem',
                                    fontSize: '0.7rem'
                                }}>
                                    🤖 {generatedPost.model}
                                </span>
                            )}
                        </div>
                        {generatedPost.image_url && (
                            <img
                                src={generatedPost.image_url}
                                alt="Generated"
                                style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: '0.5rem', marginBottom: '0.75rem' }}
                            />
                        )}
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '1rem', maxHeight: '80px', overflow: 'hidden' }}>
                            {generatedPost.content?.substring(0, 200)}...
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                                type="button"
                                className="btn"
                                onClick={() => navigate('/history')}
                                style={{ flex: 1 }}
                            >
                                {t('generator.viewHistory')}
                            </button>
                            <button
                                type="button"
                                className="btn"
                                onClick={() => { setGeneratedPost(null); setModelComparison(null); setTopic(''); }}
                                style={{ flex: 1, background: 'transparent', border: '1px solid var(--border-light)' }}
                            >
                                {t('generator.generateNew')}
                            </button>
                        </div>
                    </div>
                )}

                {platform === 'Video (TikTok/Reels)' && (
                    <div style={{
                        padding: '0.75rem 1rem',
                        background: 'rgba(139, 92, 246, 0.15)',
                        borderRadius: '0.5rem',
                        marginBottom: '1rem',
                        fontSize: '0.85rem',
                        color: '#a78bfa'
                    }}>
                        🎬 Video mode: Will generate a video script with scenes, voiceover text, AI image, and audio narration.
                    </div>
                )}

                {trends.length > 0 && (
                    <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.03)', padding: '1rem', borderRadius: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <label style={{ fontSize: '0.9rem', color: 'var(--text-primary)', fontWeight: '500' }}>{t('generator.trends')}</label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={autoTrends}
                                    onChange={(e) => setAutoTrends(e.target.checked)}
                                />
                                {t('generator.autoIntegration')}
                            </label>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {trends.map(t => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => {
                                        if (selectedTrends.includes(t)) {
                                            setSelectedTrends(selectedTrends.filter(i => i !== t));
                                            setAutoTrends(false);
                                        } else {
                                            setSelectedTrends([...selectedTrends, t]);
                                            setAutoTrends(false);
                                        }
                                    }}
                                    style={{
                                        background: selectedTrends.includes(t) ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                                        border: selectedTrends.includes(t) ? '1px solid var(--accent-primary)' : '1px solid var(--border-light)',
                                        color: selectedTrends.includes(t) ? 'white' : 'var(--text-primary)',
                                        padding: '0.4rem 0.8rem',
                                        borderRadius: '2rem',
                                        fontSize: '0.8rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.3rem'
                                    }}
                                >
                                    {t}
                                    {selectedTrends.includes(t) && <span>✓</span>}
                                </button>
                            ))}
                        </div>
                        {autoTrends && (
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                                {t('generator.autoNote')}
                            </p>
                        )}
                    </div>
                )}

                <button type="submit" className="btn" disabled={loading} style={{ position: 'relative' }}>
                    {loading ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span className="spinner" style={{
                                width: '16px',
                                height: '16px',
                                border: '2px solid rgba(255,255,255,0.3)',
                                borderTop: '2px solid white',
                                borderRadius: '50%',
                                animation: 'spin 1s linear infinite'
                            }}></span>
                            {loadingStage || t('generator.generating')}
                        </span>
                    ) : t('generator.generateButton')}
                </button>

                {/* Loading Animation Styles */}
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `}</style>
            </form>
        </div>
    );
};

export default ContentGenerator;

