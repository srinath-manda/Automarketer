import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Products from './pages/Products';
import Generate from './pages/Generate';
import History from './pages/History';
import Automation from './pages/Automation';
import Profile from './pages/Profile';
import EmailList from './pages/EmailList';
import VideoGenerator from './pages/VideoGenerator';
import AITools from './pages/AITools';
import Analytics from './pages/Analytics';

const PrivateRoute = ({ children }) => {
    const { user, loading } = useAuth();
    if (loading) return <div style={{ color: 'white', textAlign: 'center', marginTop: '2rem' }}>Loading...</div>;
    return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

import { LanguageProvider } from './context/LanguageContext';

function App() {
    return (
        <AuthProvider>
            <LanguageProvider>
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
                        <Route path="/products" element={<PrivateRoute><Products /></PrivateRoute>} />
                        <Route path="/generate" element={<PrivateRoute><Generate /></PrivateRoute>} />
                        <Route path="/history" element={<PrivateRoute><History /></PrivateRoute>} />
                        <Route path="/automation" element={<PrivateRoute><Automation /></PrivateRoute>} />
                        <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
                        <Route path="/emails" element={<PrivateRoute><EmailList /></PrivateRoute>} />
                        <Route path="/video" element={<PrivateRoute><VideoGenerator /></PrivateRoute>} />
                        <Route path="/ai-tools" element={<PrivateRoute><AITools /></PrivateRoute>} />
                        <Route path="/analytics" element={<PrivateRoute><Analytics /></PrivateRoute>} />

                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            </LanguageProvider>
        </AuthProvider>
    )
}

export default App

