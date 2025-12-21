import React, { useState, useEffect } from 'react';
import api from '../api';
import { useLanguage } from '../context/LanguageContext';
import {
    TrendingUp, Beaker, Hash, Dna, Globe, BarChart3,
    Sparkles, Loader2, ChevronRight, Zap, Target, DollarSign,
    Languages, Brain, Rocket
} from 'lucide-react';

const AITools = () => {
    const { language: globalLanguage } = useLanguage();
    const [business, setBusiness] = useState(null);
    const [activeTab, setActiveTab] = useState('roi');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [content, setContent] = useState('');
    const [language, setLanguage] = useState('hindi');

    // Sync with global language settings
    useEffect(() => {
        const langMap = {
            'hi': 'hindi', 'ta': 'tamil', 'te': 'telugu', 'mr': 'marathi',
            'bn': 'bengali', 'gu': 'gujarati', 'kn': 'kannada', 'ml': 'malayalam'
        };
        if (langMap[globalLanguage]) {
            setLanguage(langMap[globalLanguage]);
            // Optional: Switch to translation tab if language changes? 
            // Better not force it, just be ready.
        }
    }, [globalLanguage]);

    const LANGUAGES = [
        { id: 'hindi', name: 'Hindi', native: 'हिंदी' },
        { id: 'tamil', name: 'Tamil', native: 'தமிழ்' },
        { id: 'telugu', name: 'Telugu', native: 'తెలుగు' },
        { id: 'marathi', name: 'Marathi', native: 'मराठी' },
        { id: 'bengali', name: 'Bengali', native: 'বাংলা' },
        { id: 'gujarati', name: 'Gujarati', native: 'ગુજરાતી' },
        { id: 'kannada', name: 'Kannada', native: 'ಕನ್ನಡ' },
        { id: 'malayalam', name: 'Malayalam', native: 'മലയാളം' },
    ];

    useEffect(() => {
        api.get('/businesses').then(res => {
            if (res.data.length > 0) setBusiness(res.data[0]);
        }).catch(console.error);
    }, []);

    const runROIPredictor = async () => {
        if (!content.trim()) return;
        setLoading(true);
        setResult(null);
        try {
            const res = await api.post('/roi-predict', {
                content,
                platform: 'Instagram',
                business_id: business?.id
            });
            setResult({ type: 'roi', data: res.data.prediction });
        } catch (e) {
            setResult({ type: 'error', message: e.response?.data?.error || e.message });
        }
        setLoading(false);
    };

    const runABTesting = async () => {
        if (!content.trim()) return;
        setLoading(true);
        setResult(null);
        try {
            const res = await api.post('/ab-testing', {
                content,
                platform: 'Instagram',
                business_id: business?.id
            });
            console.log('A/B result:', JSON.stringify(res.data, null, 2));
            if (res.data.result?.error) {
                setResult({ type: 'error', message: res.data.result.error });
            } else {
                setResult({ type: 'ab', data: res.data.result });
            }
        } catch (e) {
            console.error('A/B error:', e);
            setResult({ type: 'error', message: e.response?.data?.error || e.message });
        }
        setLoading(false);
    };

    const runHashtagOptimizer = async () => {
        if (!content.trim()) return;
        setLoading(true);
        setResult(null);
        try {
            const res = await api.post('/hashtag-optimize', {
                content,
                platform: 'Instagram',
                business_id: business?.id
            });
            console.log('Hashtag result:', JSON.stringify(res.data, null, 2));
            if (res.data.result?.error) {
                setResult({ type: 'error', message: res.data.result.error });
            } else {
                setResult({ type: 'hashtag', data: res.data.result });
            }
        } catch (e) {
            console.error('Hashtag error:', e);
            setResult({ type: 'error', message: e.response?.data?.error || e.message });
        }
        setLoading(false);
    };

    const runBrandVoice = async () => {
        if (!content.trim()) return;
        setLoading(true);
        setResult(null);
        try {
            const res = await api.post('/brand-voice', {
                sample_content: content,
                business_id: business?.id
            });
            console.log('Brand voice result:', res.data);
            if (res.data.result?.error) {
                setResult({ type: 'error', message: res.data.result.error });
            } else {
                setResult({ type: 'voice', data: res.data.result });
            }
        } catch (e) {
            console.error('Brand voice error:', e);
            setResult({ type: 'error', message: e.response?.data?.error || e.message });
        }
        setLoading(false);
    };

    const runTranslation = async () => {
        if (!content.trim()) return;
        setLoading(true);
        setResult(null);
        try {
            const res = await api.post('/translate', {
                content,
                language,
                business_id: business?.id
            });
            console.log('Translation result:', JSON.stringify(res.data, null, 2));
            if (res.data.result?.error) {
                setResult({ type: 'error', message: res.data.result.error });
            } else {
                setResult({ type: 'translate', data: res.data.result, language: res.data.target_language });
            }
        } catch (e) {
            console.error('Translation error:', e);
            setResult({ type: 'error', message: e.response?.data?.error || e.message });
        }
        setLoading(false);
    };

    const runDemoMode = async () => {
        setLoading(true);
        setResult(null);
        try {
            const res = await api.post('/demo-mode', {
                business_id: business?.id,
                topic: content || 'Holiday Sale Special'
            });
            setResult({ type: 'demo', data: res.data });
        } catch (e) {
            setResult({ type: 'error', message: e.response?.data?.error || e.message });
        }
        setLoading(false);
    };

    const tools = [
        { id: 'roi', name: 'ROI Predictor', icon: DollarSign, color: '#10b981', desc: 'Predict reach & ROI' },
        { id: 'ab', name: 'A/B Testing', icon: Beaker, color: '#8b5cf6', desc: 'Compare variations' },
        { id: 'hashtag', name: 'Hashtag Pro', icon: Hash, color: '#ec4899', desc: 'Strategic hashtags' },
        { id: 'voice', name: 'Brand DNA', icon: Dna, color: '#f59e0b', desc: 'Extract voice' },
        { id: 'translate', name: 'Multi-Language', icon: Globe, color: '#06b6d4', desc: '8 Indian languages' },
        { id: 'demo', name: 'Demo Mode', icon: Rocket, color: '#ef4444', desc: 'Wow the judges!' },
    ];

    const handleRun = () => {
        switch (activeTab) {
            case 'roi': runROIPredictor(); break;
            case 'ab': runABTesting(); break;
            case 'hashtag': runHashtagOptimizer(); break;
            case 'voice': runBrandVoice(); break;
            case 'translate': runTranslation(); break;
            case 'demo': runDemoMode(); break;
        }
    };

    const renderResult = () => {
        if (!result) return null;

        if (result.type === 'error') {
            return (
                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '0.5rem', color: '#ef4444' }}>
                    ❌ {result.message}
                </div>
            );
        }

        if (result.type === 'roi' && result.data) {
            const d = result.data;
            return (
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1), rgba(6, 182, 212, 0.1))' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={20} /> ROI Prediction Results
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                        <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
                                {d.estimated_reach?.min?.toLocaleString()} - {d.estimated_reach?.max?.toLocaleString()}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Estimated Reach</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>
                                {d.predicted_engagement_rate}%
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Engagement Rate</div>
                        </div>
                        <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem' }}>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>
                                {d.expected_roi_multiplier}x
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Expected ROI</div>
                        </div>
                    </div>
                    <div style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>🎯 Virality Score</div>
                            <div style={{ height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ width: `${d.virality_score}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #8b5cf6)' }}></div>
                            </div>
                            <div style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>{d.virality_score}/100</div>
                        </div>
                        <div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>💰 Suggested Ad Spend</div>
                            <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>₹{d.suggested_ad_spend}</div>
                        </div>
                    </div>
                    {d.optimization_tips && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '0.5rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>💡 Optimization Tips</div>
                            <ul style={{ margin: 0, paddingLeft: '1.25rem' }}>
                                {d.optimization_tips.map((tip, i) => <li key={i}>{tip}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            );
        }

        if (result.type === 'ab' && result.data) {
            const d = result.data;
            return (
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.1))' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Beaker size={20} /> A/B Testing Results
                    </h3>
                    {d.recommendation && (
                        <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '0.5rem', marginBottom: '1rem', border: '1px solid #10b981' }}>
                            🏆 <strong>Winner: Version {d.winner}</strong> - {d.recommendation}
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {d.variations?.map((v, i) => (
                            <div key={i} style={{
                                padding: '1rem',
                                background: v.version === d.winner ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0,0,0,0.2)',
                                borderRadius: '0.5rem',
                                border: v.version === d.winner ? '2px solid #10b981' : '1px solid var(--border-light)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <span style={{ fontWeight: 'bold' }}>Version {v.version}: {v.approach}</span>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        background: `rgba(${v.virality_score > 70 ? '16, 185, 129' : '139, 92, 246'}, 0.3)`,
                                        borderRadius: '1rem',
                                        fontSize: '0.85rem'
                                    }}>
                                        {v.virality_score}% virality
                                    </span>
                                </div>
                                <p style={{ margin: '0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{v.content}</p>
                                <div style={{ fontSize: '0.8rem', color: '#8b5cf6' }}>
                                    📌 Best for: {v.best_for}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        if (result.type === 'hashtag' && result.data) {
            const d = result.data;
            return (
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(236, 72, 153, 0.1), rgba(249, 115, 22, 0.1))' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Hash size={20} /> Hashtag Strategy
                    </h3>
                    {d.strategy && (
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                            <div style={{ flex: 1, textAlign: 'center', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.2)', borderRadius: '0.5rem' }}>
                                <div style={{ fontWeight: 'bold' }}>{d.strategy.high_competition}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>High Comp</div>
                            </div>
                            <div style={{ flex: 1, textAlign: 'center', padding: '0.75rem', background: 'rgba(245, 158, 11, 0.2)', borderRadius: '0.5rem' }}>
                                <div style={{ fontWeight: 'bold' }}>{d.strategy.medium_competition}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Medium</div>
                            </div>
                            <div style={{ flex: 1, textAlign: 'center', padding: '0.75rem', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '0.5rem' }}>
                                <div style={{ fontWeight: 'bold' }}>{d.strategy.low_competition}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Low (Niche)</div>
                            </div>
                        </div>
                    )}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {d.hashtags?.map((h, i) => (
                            <span key={i} style={{
                                padding: '0.5rem 1rem',
                                background: h.competition === 'High' ? 'rgba(239, 68, 68, 0.2)' :
                                    h.competition === 'Medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                                border: `1px solid ${h.competition === 'High' ? '#ef4444' : h.competition === 'Medium' ? '#f59e0b' : '#10b981'}`,
                                borderRadius: '2rem',
                                fontSize: '0.85rem'
                            }}>
                                {h.tag} <span style={{ opacity: 0.7 }}>({h.estimated_posts})</span>
                            </span>
                        ))}
                    </div>
                    {d.tips && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>💡 Pro Tips</div>
                            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem' }}>
                                {d.tips.map((tip, i) => <li key={i}>{tip}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            );
        }

        if (result.type === 'voice' && result.data) {
            const d = result.data;
            const dna = d.brand_voice_dna || {};
            return (
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(139, 92, 246, 0.1))' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Dna size={20} /> Brand Voice DNA
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>🎭 Tone</div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{dna.tone || d.tone || 'Not detected'}</div>
                        </div>
                        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>⚡ Energy</div>
                            <div style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{dna.energy_level || d.energy_level || d.energy || 'Not detected'}</div>
                        </div>
                    </div>
                    {d.emoji_style && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>😊 Emoji Style</div>
                            <div style={{ fontSize: '1.5rem' }}>{d.emoji_style.favorite_emojis?.join(' ')}</div>
                            <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Usage: {d.emoji_style.usage_frequency}</div>
                        </div>
                    )}
                    {d.vocabulary_patterns && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '0.5rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>📝 Favorite Words</div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                {d.vocabulary_patterns.favorite_words?.map((w, i) => (
                                    <span key={i} style={{ padding: '0.25rem 0.75rem', background: 'rgba(245, 158, 11, 0.3)', borderRadius: '1rem', fontSize: '0.85rem' }}>"{w}"</span>
                                ))}
                            </div>
                        </div>
                    )}
                    {d.voice_summary && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '0.5rem', fontStyle: 'italic' }}>
                            "{d.voice_summary}"
                        </div>
                    )}
                </div>
            );
        }

        if (result.type === 'translate' && result.data) {
            const d = result.data;
            return (
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.1), rgba(16, 185, 129, 0.1))' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Globe size={20} /> Translation: {result.language?.charAt(0).toUpperCase() + result.language?.slice(1)}
                    </h3>
                    <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '1.25rem', lineHeight: 1.6 }}>{d.translated_content}</div>
                    </div>
                    {d.transliteration && (
                        <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>🔤 Transliteration (Roman)</div>
                            <div style={{ fontStyle: 'italic' }}>{d.transliteration}</div>
                        </div>
                    )}
                    {d.hashtags_translated && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                            {d.hashtags_translated.map((h, i) => (
                                <span key={i} style={{ padding: '0.5rem 1rem', background: 'rgba(6, 182, 212, 0.2)', borderRadius: '2rem' }}>{h}</span>
                            ))}
                        </div>
                    )}
                    {d.cultural_adaptations && (
                        <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '0.5rem' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>🎯 Cultural Adaptations</div>
                            <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.9rem' }}>
                                {d.cultural_adaptations.map((a, i) => <li key={i}>{a}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            );
        }

        if (result.type === 'demo' && result.data) {
            const d = result.data;
            return (
                <div className="card" style={{ background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(245, 158, 11, 0.1))' }}>
                    <h3 style={{ margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Rocket size={20} /> Demo Mode Results 🎉
                    </h3>
                    {d.summary && (
                        <div style={{ padding: '1rem', background: 'rgba(16, 185, 129, 0.2)', borderRadius: '0.5rem', marginBottom: '1.5rem', textAlign: 'center', fontSize: '1.1rem' }}>
                            {d.summary.message}
                        </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {d.steps?.map((step, i) => (
                            <div key={i} style={{
                                padding: '1rem',
                                background: step.status === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                borderRadius: '0.5rem',
                                borderLeft: `4px solid ${step.status === 'success' ? '#10b981' : '#ef4444'}`
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 'bold' }}>Step {step.step}: {step.name}</span>
                                    <span style={{
                                        padding: '0.25rem 0.75rem',
                                        background: step.status === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)',
                                        borderRadius: '1rem',
                                        fontSize: '0.75rem'
                                    }}>
                                        {step.status === 'success' ? '✅ Success' : '❌ Error'}
                                    </span>
                                </div>
                                {step.output && typeof step.output === 'string' && (
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        {step.output.substring(0, 200)}...
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return null;
    };

    return (
        <div>
            <h1 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Brain size={28} /> AI Power Tools 🚀
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Unique AI-powered features to supercharge your marketing. These tools make us stand out!
            </p>

            {/* Tool Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
                {tools.map(tool => (
                    <button
                        key={tool.id}
                        onClick={() => { setActiveTab(tool.id); setResult(null); }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.75rem 1.25rem',
                            background: activeTab === tool.id ? `${tool.color}33` : 'rgba(255,255,255,0.05)',
                            border: `2px solid ${activeTab === tool.id ? tool.color : 'transparent'}`,
                            borderRadius: '0.75rem',
                            color: activeTab === tool.id ? tool.color : 'white',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <tool.icon size={18} />
                        <span style={{ fontWeight: activeTab === tool.id ? 'bold' : 'normal' }}>{tool.name}</span>
                    </button>
                ))}
            </div>

            {/* Input Area */}
            <div className="card" style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    {tools.find(t => t.id === activeTab)?.icon &&
                        React.createElement(tools.find(t => t.id === activeTab).icon, { size: 20, color: tools.find(t => t.id === activeTab).color })}
                    <h3 style={{ margin: 0 }}>{tools.find(t => t.id === activeTab)?.name}</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    {activeTab === 'roi' && 'Predict reach, engagement, and ROI before publishing your content.'}
                    {activeTab === 'ab' && 'Generate 3 variations using different psychological approaches and see which performs best.'}
                    {activeTab === 'hashtag' && 'Get strategic hashtag recommendations with competition analysis.'}
                    {activeTab === 'voice' && 'Analyze your content to extract your unique brand voice DNA.'}
                    {activeTab === 'translate' && 'Translate and culturally adapt your content for Indian regional languages.'}
                    {activeTab === 'demo' && 'Run all AI features in sequence for a spectacular demo to the judges!'}
                </p>

                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={activeTab === 'demo' ? 'Enter a topic (e.g., "Holiday Sale") or leave empty for default...' : 'Paste or type your content here...'}
                    style={{
                        width: '100%',
                        minHeight: '120px',
                        padding: '1rem',
                        background: 'rgba(0,0,0,0.3)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '0.5rem',
                        color: 'white',
                        fontSize: '0.95rem',
                        resize: 'vertical'
                    }}
                />

                {activeTab === 'translate' && (
                    <div style={{ marginTop: '1rem' }}>
                        <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'block' }}>
                            Target Language:
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {LANGUAGES.map(lang => (
                                <button
                                    key={lang.id}
                                    onClick={() => setLanguage(lang.id)}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: language === lang.id ? 'rgba(6, 182, 212, 0.3)' : 'rgba(255,255,255,0.05)',
                                        border: `1px solid ${language === lang.id ? '#06b6d4' : 'var(--border-light)'}`,
                                        borderRadius: '0.5rem',
                                        color: language === lang.id ? '#06b6d4' : 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {lang.name} <span style={{ opacity: 0.7 }}>({lang.native})</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    onClick={handleRun}
                    disabled={loading || (!content.trim() && activeTab !== 'demo')}
                    style={{
                        marginTop: '1rem',
                        width: '100%',
                        padding: '1rem',
                        background: `linear-gradient(135deg, ${tools.find(t => t.id === activeTab)?.color}, ${tools.find(t => t.id === activeTab)?.color}99)`,
                        border: 'none',
                        borderRadius: '0.5rem',
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        cursor: loading ? 'wait' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem'
                    }}
                >
                    {loading ? (
                        <>
                            <Loader2 size={20} className="spin" /> Processing...
                        </>
                    ) : (
                        <>
                            <Sparkles size={20} /> Run {tools.find(t => t.id === activeTab)?.name}
                        </>
                    )}
                </button>
            </div>

            {/* Results */}
            {renderResult()}

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

export default AITools;
