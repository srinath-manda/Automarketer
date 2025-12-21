import React, { useState, useEffect } from 'react';
import { Mail, Plus, Trash2, Save, Users } from 'lucide-react';

const EmailList = () => {
    const [emails, setEmails] = useState([]);
    const [newEmail, setNewEmail] = useState('');
    const [message, setMessage] = useState(null);

    useEffect(() => {
        // Load emails from localStorage
        const saved = localStorage.getItem('automarketer_email_list');
        if (saved) {
            setEmails(JSON.parse(saved));
        }
    }, []);

    const saveEmails = (emailList) => {
        localStorage.setItem('automarketer_email_list', JSON.stringify(emailList));
        setEmails(emailList);
    };

    const addEmail = () => {
        const email = newEmail.trim();
        if (!email) return;

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setMessage({ type: 'error', text: 'Please enter a valid email address' });
            setTimeout(() => setMessage(null), 3000);
            return;
        }

        if (emails.includes(email)) {
            setMessage({ type: 'error', text: 'Email already exists in the list' });
            setTimeout(() => setMessage(null), 3000);
            return;
        }

        const updated = [...emails, email];
        saveEmails(updated);
        setNewEmail('');
        setMessage({ type: 'success', text: `✅ Added ${email}` });
        setTimeout(() => setMessage(null), 3000);
    };

    const removeEmail = (email) => {
        const updated = emails.filter(e => e !== email);
        saveEmails(updated);
        setMessage({ type: 'success', text: `Removed ${email}` });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            addEmail();
        }
    };

    return (
        <div>
            <h1 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Mail size={28} /> Email Recipients
            </h1>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Manage your email list. Posts sent to "Email" will be delivered to all addresses below.
            </p>

            {message && (
                <div style={{
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    borderRadius: '0.5rem',
                    background: message.type === 'success' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                    border: `1px solid ${message.type === 'success' ? '#10b981' : '#ef4444'}`,
                    color: message.type === 'success' ? '#10b981' : '#ef4444'
                }}>
                    {message.text}
                </div>
            )}

            {/* Add Email Form */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Plus size={18} /> Add New Email
                </h3>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="recipient@example.com"
                        style={{
                            flex: 1,
                            padding: '0.75rem 1rem',
                            background: 'rgba(0,0,0,0.2)',
                            border: '1px solid var(--border-light)',
                            borderRadius: '0.5rem',
                            color: 'white',
                            fontSize: '0.95rem'
                        }}
                    />
                    <button
                        onClick={addEmail}
                        className="primary-button"
                        style={{
                            padding: '0.75rem 1.5rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Plus size={18} /> Add
                    </button>
                </div>
            </div>

            {/* Email List */}
            <div className="card">
                <h3 style={{ margin: '0 0 1rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Users size={18} /> Saved Recipients ({emails.length})
                </h3>

                {emails.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '2rem',
                        color: 'var(--text-secondary)',
                        border: '1px dashed var(--border-light)',
                        borderRadius: '0.5rem'
                    }}>
                        No emails added yet. Add your first recipient above.
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {emails.map((email, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.75rem 1rem',
                                    background: 'rgba(255, 255, 255, 0.05)',
                                    borderRadius: '0.5rem',
                                    border: '1px solid var(--border-light)'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <Mail size={16} style={{ color: 'var(--text-secondary)' }} />
                                    <span>{email}</span>
                                </div>
                                <button
                                    onClick={() => removeEmail(email)}
                                    style={{
                                        background: 'rgba(239, 68, 68, 0.2)',
                                        border: '1px solid #ef4444',
                                        color: '#ef4444',
                                        padding: '0.4rem 0.75rem',
                                        borderRadius: '0.5rem',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.4rem',
                                        fontSize: '0.8rem'
                                    }}
                                >
                                    <Trash2 size={14} /> Remove
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {emails.length > 0 && (
                    <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        background: 'rgba(79, 70, 229, 0.1)',
                        borderRadius: '0.5rem',
                        fontSize: '0.85rem',
                        color: 'var(--text-secondary)'
                    }}>
                        💡 When you select "Email" in multi-platform posting, your content will be sent to all {emails.length} recipient(s) at once.
                    </div>
                )}
            </div>
        </div>
    );
};

export default EmailList;
