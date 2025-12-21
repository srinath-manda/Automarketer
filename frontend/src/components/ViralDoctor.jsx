import React, { useState } from 'react';
import api from '../api';
import { Zap, Activity, MessageSquare, RefreshCw } from 'lucide-react';

const ViralDoctor = () => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);
    const [analysis, setAnalysis] = useState(null);

    const handleAnalyze = async () => {
        if (!content.trim()) return;
        setLoading(true);
        try {
            const res = await api.post('/viral-doctor', { content });
            setAnalysis(res.data);
        } catch (error) {
            console.error("Analysis failed", error);
            alert("Failed to analyze content.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.1) 0%, rgba(255, 255, 255, 0.02) 100%)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Zap color="#F59E0B" />
                <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Viral Doctor (AI Analysis)</h2>
            </div>

            <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your draft here to check its virality potential..."
                style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '0.75rem',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--border-light)',
                    borderRadius: '0.5rem',
                    color: 'white',
                    marginBottom: '1rem',
                    fontSize: '0.9rem',
                    resize: 'vertical'
                }}
            />

            <button
                onClick={handleAnalyze}
                disabled={loading || !content.trim()}
                className="primary-button"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
                {loading ? <RefreshCw className="animate-spin" size={18} /> : <Activity size={18} />}
                {loading ? 'Analyzing...' : 'Check Virality Score'}
            </button>

            {analysis && (
                <div style={{ marginTop: '1.5rem', animation: 'fadeIn 0.4s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Virality Score:</span>
                        <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            color: analysis.score > 70 ? '#10B981' : '#F59E0B',
                            textShadow: '0 0 10px rgba(16, 185, 129, 0.3)'
                        }}>
                            {analysis.score}/100
                        </div>
                    </div>

                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Psychological Triggers</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.4rem' }}>
                            {analysis.triggers?.map((t, i) => (
                                <span key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.2rem 0.6rem', borderRadius: '1rem', fontSize: '0.75rem' }}>
                                    {t}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>AI Recommendations</label>
                        <ul style={{ paddingLeft: '1.2rem', marginTop: '0.5rem', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>
                            {analysis.recommendations?.map((r, i) => <li key={i} style={{ marginBottom: '0.3rem' }}>{r}</li>)}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ViralDoctor;
