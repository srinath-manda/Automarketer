import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

// Determine if we're in production (deployed on Vercel) or development
const isProduction = window.location.hostname !== 'localhost';
const API_BASE_URL = isProduction
    ? 'https://automarketer-backend-2mz4.onrender.com/api'
    : 'http://localhost:8000/api';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            fetchUser();
        } else {
            setLoading(false);
        }
    }, []);

    const fetchUser = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/auth/me`);
            setUser(response.data);
        } catch (error) {
            console.error("Failed to fetch user", error);
            // Force logout on ANY error during initial check to prevent stuck states
            logout();
            // Hard redirect to clear any lingering React state/memory
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                window.location.href = '/login';
            }
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setUser(user);
        return user;
    };

    const register = async (username, email, password) => {
        await axios.post(`${API_BASE_URL}/auth/register`, { username, email, password });
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};
