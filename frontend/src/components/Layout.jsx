import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
    LayoutDashboard,
    ShoppingBag,
    Sparkles,
    History,
    LogOut,
    BarChart3,
    UserCircle,
    Zap,
    Mail,
    Video,
    Brain,
    PieChart,
    Globe,
    ChevronUp,
    Check
} from 'lucide-react';

const Layout = ({ children }) => {
    const { logout, user } = useAuth();
    const { t, language, changeLanguage, LANGUAGES } = useLanguage();
    const navigate = useNavigate();
    const [showLangMenu, setShowLangMenu] = useState(false);

    const navItems = [
        { path: '/', label: t('nav.home'), icon: LayoutDashboard },
        { path: '/products', label: t('nav.products'), icon: ShoppingBag },
        { path: '/generate', label: t('nav.generate'), icon: Sparkles },
        { path: '/ai-tools', label: t('nav.aitools'), icon: Brain, highlight: true },
        { path: '/video', label: t('nav.video'), icon: Video },
        { path: '/analytics', label: t('nav.analytics'), icon: PieChart },
        { path: '/history', label: t('nav.history'), icon: History },
        { path: '/automation', label: t('nav.automation'), icon: Zap },
        { path: '/emails', label: t('nav.emails'), icon: Mail },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const currentLang = LANGUAGES.find(l => l.code === language);

    return (
        <div className="layout-container" style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-dark)' }}>
            {/* Sidebar */}
            <aside className="sidebar" style={{
                width: '260px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRight: '1px solid var(--border-light)',
                display: 'flex',
                flexDirection: 'column',
                position: 'fixed',
                height: '100vh',
                zIndex: 100
            }}>
                <div className="sidebar-header" style={{
                    padding: '2rem',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem'
                }}>
                    <BarChart3 size={32} color="#4F46E5" />
                    AutoMarketer
                </div>

                <nav className="sidebar-nav" style={{ flex: 1, padding: '1rem', overflowY: 'auto' }}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            style={({ isActive }) => ({
                                display: 'flex',
                                alignItems: 'center',
                                gap: '1rem',
                                padding: '1rem',
                                color: isActive ? 'white' : item.highlight ? '#8b5cf6' : 'var(--text-secondary)',
                                textDecoration: 'none',
                                borderRadius: '0.75rem',
                                background: isActive
                                    ? (item.highlight ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(236, 72, 153, 0.2))' : 'rgba(79, 70, 229, 0.15)')
                                    : (item.highlight ? 'rgba(139, 92, 246, 0.1)' : 'transparent'),
                                border: item.highlight ? '1px solid rgba(139, 92, 246, 0.3)' : 'none',
                                marginBottom: '0.5rem',
                                transition: 'all 0.2s',
                                fontWeight: item.highlight ? '600' : 'normal'
                            })}
                        >
                            <item.icon size={20} color={item.highlight ? '#8b5cf6' : undefined} />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>


                <div className="sidebar-footer" style={{ padding: '1.5rem', borderTop: '1px solid var(--border-light)' }}>

                    {/* Language Switcher */}
                    <div style={{ position: 'relative', marginBottom: '1rem' }}>
                        <button
                            onClick={() => setShowLangMenu(!showLangMenu)}
                            style={{
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '0.75rem',
                                padding: '0.75rem',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--border-light)',
                                borderRadius: '0.75rem',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Globe size={16} color="#06b6d4" />
                                <span>{currentLang?.native || 'Language'}</span>
                            </div>
                            <ChevronUp size={16} style={{ transform: showLangMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                        </button>

                        {showLangMenu && (
                            <div style={{
                                position: 'absolute',
                                bottom: '110%',
                                left: 0,
                                width: '100%',
                                background: '#1e1e2e',
                                border: '1px solid var(--border-light)',
                                borderRadius: '0.75rem',
                                padding: '0.5rem',
                                maxHeight: '300px',
                                overflowY: 'auto',
                                boxShadow: '0 -4px 20px rgba(0,0,0,0.5)',
                                zIndex: 1000
                            }}>
                                <div style={{ fontSize: '0.75rem', padding: '0.5rem', color: 'var(--text-secondary)', fontWeight: 'bold' }}>SELECT LANGUAGE</div>
                                {LANGUAGES.map(lang => (
                                    <button
                                        key={lang.code}
                                        onClick={() => { changeLanguage(lang.code); setShowLangMenu(false); }}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '0.75rem',
                                            background: language === lang.code ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
                                            border: 'none',
                                            borderRadius: '0.5rem',
                                            color: language === lang.code ? '#06b6d4' : 'var(--text-secondary)',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            marginBottom: '0.25rem'
                                        }}
                                    >
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '0.9rem', color: 'white' }}>{lang.native}</span>
                                            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>{lang.name}</span>
                                        </div>
                                        {language === lang.code && <Check size={16} />}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div
                        onClick={() => navigate('/profile')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            marginBottom: '1rem',
                            padding: '1rem',
                            background: 'rgba(99, 102, 241, 0.1)',
                            borderRadius: '0.75rem',
                            border: '1px solid rgba(99, 102, 241, 0.2)',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.2)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.1)'}
                    >
                        <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '1.1rem'
                        }}>
                            {user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div style={{ overflow: 'hidden', flex: 1 }}>
                            <div style={{ color: 'white', fontSize: '0.9rem', fontWeight: 'bold', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user?.username}
                            </div>
                            <div style={{ color: 'var(--text-secondary)', fontSize: '0.7rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {user?.email || 'user@email.com'}
                            </div>
                            <div style={{
                                display: 'inline-block',
                                marginTop: '0.25rem',
                                padding: '0.15rem 0.5rem',
                                background: 'rgba(16, 185, 129, 0.2)',
                                color: '#10b981',
                                borderRadius: '1rem',
                                fontSize: '0.65rem',
                                fontWeight: '600'
                            }}>
                                ✨ Free Plan
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            width: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            padding: '0.75rem',
                            color: '#FF6B6B',
                            background: 'rgba(255, 107, 107, 0.1)',
                            border: 'none',
                            borderRadius: '0.75rem',
                            cursor: 'pointer',
                            fontSize: '0.9rem'
                        }}
                    >
                        <LogOut size={18} />
                        {t('nav.logout')}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ marginLeft: '260px', flex: 1, padding: '2rem' }}>
                {children}
            </main>
        </div>
    );
};

export default Layout;
