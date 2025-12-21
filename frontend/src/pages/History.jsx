import React, { useState, useEffect } from 'react';
import api from '../api';
import PostCard from '../components/PostCard';
import { History as HistoryIcon, Search } from 'lucide-react';

const History = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchContent();
    }, []);

    const fetchContent = async () => {
        try {
            const res = await api.get('/content');
            setPosts(res.data);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPosts = posts.filter(post =>
        post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.platform.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div style={{ color: 'white' }}>Loading History...</div>;

    return (
        <div className="history-page">
            <header style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <h1 style={{ color: 'white', marginBottom: '0.5rem' }}>Generation History 📚</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Browse and reuse all your past AI-generated marketing content.</p>
                </div>

                <div style={{ position: 'relative', width: '300px' }}>
                    <Search size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        placeholder="Search content..."
                        style={{
                            width: '100%',
                            padding: '0.75rem 1rem 0.75rem 2.8rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: '1px solid var(--border-light)',
                            borderRadius: '2rem',
                            color: 'white',
                            fontSize: '0.9rem'
                        }}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </header>

            {filteredPosts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '5rem', color: 'var(--text-secondary)' }}>
                    <HistoryIcon size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                    <p>{searchTerm ? 'No matches found for your search.' : 'No content generated yet.'}</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: '1.5rem' }}>
                    {filteredPosts.map(post => (
                        <PostCard key={post.id} post={post} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default History;
