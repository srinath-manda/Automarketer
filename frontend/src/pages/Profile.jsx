import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Building, MapPin, FileText, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { useLanguage } from '../context/LanguageContext';

const Profile = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState(null);
    const [profile, setProfile] = useState({
        username: '',
        email: '',
        full_name: '',
        mobile: '',
        bio: '',
        company: '',
        location: ''
    });
    const [business, setBusiness] = useState({
        name: '',
        industry: '',
        description: '',
        target_audience: ''
    });
    const [isNewBusiness, setIsNewBusiness] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [profileRes, businessRes] = await Promise.all([
                api.get('/profile'),
                api.get('/businesses')
            ]);
            setProfile(profileRes.data);
            if (businessRes.data && businessRes.data.length > 0) {
                setBusiness(businessRes.data[0]);
                setIsNewBusiness(false);
            }
        } catch (e) {
            setMessage({ type: 'error', text: 'Failed to load profile' });
        }
        setLoading(false);
    };

    const handleChange = (field, value) => {
        setProfile({ ...profile, [field]: value });
    };

    const handleBusinessChange = (field, value) => {
        setBusiness({ ...business, [field]: value });
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);
        let success = true;

        try {
            // Save User Profile
            const res = await api.put('/profile', profile);
            if (res.data.success) {
                setProfile(res.data.user);
            } else {
                setMessage({ type: 'error', text: res.data.error || 'Update failed' });
                success = false;
            }

            // Save Business Profile
            if (business.name) {
                let busRes;
                if (isNewBusiness) {
                    busRes = await api.post('/business', business);
                } else {
                    busRes = await api.put(`/business/${business.id}`, business);
                }

                if (busRes.status === 200 || busRes.status === 201) {
                    setBusiness(busRes.data);
                    setIsNewBusiness(false);
                } else {
                    success = false;
                }
            }

            if (success) {
                setMessage({ type: 'success', text: '✅ Profile & Business updated successfully!' });
            }

        } catch (e) {
            setMessage({ type: 'error', text: e.response?.data?.error || 'Failed to update' });
        }
        setSaving(false);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '4rem' }}>
                <div className="loading-spinner"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        background: 'rgba(255,255,255,0.1)',
                        border: 'none',
                        borderRadius: '0.5rem',
                        padding: '0.5rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center'
                    }}
                >
                    <ArrowLeft size={20} color="white" />
                </button>
                <h1 style={{ margin: 0 }}>👤 My Profile</h1>
            </div>

            {message && (
                <div style={{
                    padding: '1rem',
                    marginBottom: '1.5rem',
                    borderRadius: '0.5rem',
                    background: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    color: message.type === 'success' ? '#10b981' : '#ef4444',
                    border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`
                }}>
                    {message.text}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
                {/* Avatar & Quick Info */}
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1.5rem',
                        fontSize: '3rem',
                        color: 'white',
                        fontWeight: 'bold'
                    }}>
                        {profile.full_name?.charAt(0).toUpperCase() || profile.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <h2 style={{ margin: '0 0 0.5rem' }}>{profile.full_name || profile.username}</h2>
                    <p style={{ color: 'var(--text-secondary)', margin: '0 0 1rem' }}>{profile.email}</p>
                    <div style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.75rem',
                        background: 'rgba(16, 185, 129, 0.2)',
                        color: '#10b981',
                        borderRadius: '1rem',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                    }}>
                        ✨ Free Plan
                    </div>
                    {profile.created_at && (
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '1.5rem' }}>
                            Member since {new Date(profile.created_at).toLocaleDateString()}
                        </p>
                    )}
                </div>

                {/* Edit Form */}
                <div className="card">
                    <h3 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Edit Profile</h3>

                    <div className="input-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={16} /> Username
                        </label>
                        <input
                            type="text"
                            value={profile.username || ''}
                            onChange={(e) => handleChange('username', e.target.value)}
                        />
                    </div>

                    <div className="input-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={16} /> Full Name
                        </label>
                        <input
                            type="text"
                            value={profile.full_name || ''}
                            onChange={(e) => handleChange('full_name', e.target.value)}
                            placeholder="Enter your full name"
                        />
                    </div>

                    <div className="input-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Mail size={16} /> Email (read-only)
                        </label>
                        <input
                            type="email"
                            value={profile.email || ''}
                            disabled
                            style={{ opacity: 0.6, cursor: 'not-allowed' }}
                        />
                    </div>

                    <div className="input-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Phone size={16} /> Mobile
                        </label>
                        <input
                            type="tel"
                            value={profile.mobile || ''}
                            onChange={(e) => handleChange('mobile', e.target.value)}
                            placeholder="+91 1234567890"
                        />
                    </div>

                    <div className="input-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <MapPin size={16} /> Location
                        </label>
                        <input
                            type="text"
                            value={profile.location || ''}
                            onChange={(e) => handleChange('location', e.target.value)}
                            placeholder="City, Country"
                        />
                    </div>

                    {/* Business Profile Section */}
                    <h3 style={{ marginTop: '2rem', marginBottom: '1rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem' }}>
                        🏢 {t('generator.manualBusiness') || 'Business Profile'}
                    </h3>

                    <div className="input-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Building size={16} /> {t('generator.companyName') || 'Business Name'}
                        </label>
                        <input
                            type="text"
                            value={business.name || ''}
                            onChange={(e) => handleBusinessChange('name', e.target.value)}
                            placeholder="e.g. Acme Corp"
                        />
                    </div>

                    <div className="input-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={16} /> {t('generator.industry') || 'Industry'}
                        </label>
                        <input
                            type="text"
                            value={business.industry || ''}
                            onChange={(e) => handleBusinessChange('industry', e.target.value)}
                            placeholder="e.g. Tech, Food, Retail"
                        />
                    </div>

                    <div className="input-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <User size={16} /> {t('generator.targetAudience') || 'Target Audience'}
                        </label>
                        <input
                            type="text"
                            value={business.target_audience || ''}
                            onChange={(e) => handleBusinessChange('target_audience', e.target.value)}
                            placeholder="e.g. Gen Z, Professionals"
                        />
                    </div>

                    <div className="input-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <FileText size={16} /> {t('generator.description') || 'Business Description'}
                        </label>
                        <textarea
                            value={business.description || ''}
                            onChange={(e) => handleBusinessChange('description', e.target.value)}
                            placeholder="Describe your business, products, and services..."
                            rows={3}
                            style={{
                                width: '100%',
                                padding: '1rem',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid var(--border-light)',
                                borderRadius: '0.75rem',
                                color: 'white',
                                resize: 'vertical'
                            }}
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="btn"
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Profile;
