import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Volunteer } from '@/types';
import { supabase } from '@/lib/supabase';

interface UserContextType {
    user: User | null;
    volunteerData: Volunteer | null;
    loading: boolean;
    login: (email: string, role: User['role']) => Promise<void>;
    logout: () => void;
    refreshVolunteerData: () => Promise<void>;
    isAdmin: boolean;
    isDirector: boolean;
    isVolunteer: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [volunteerData, setVolunteerData] = useState<Volunteer | null>(null);
    const [loading, setLoading] = useState(true);

    // Load user from localStorage or Supabase on mount
    useEffect(() => {
        const savedUser = localStorage.getItem('bc_connect_user');
        if (savedUser) {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            if (parsedUser.role === 'volunteer') {
                fetchVolunteerData(parsedUser.email);
            }
        }
        setLoading(false);
    }, []);

    const fetchVolunteerData = async (email: string) => {
        console.log('[UserContext] Fetching volunteer data for:', email);
        try {
            const { data, error } = await supabase
                .from('volunteers')
                .select('*')
                .eq('email', email)
                .limit(1);

            if (error) {
                console.error('[UserContext] Error fetching volunteer:', error);
                return;
            }

            if (data && data.length > 0) {
                console.log('[UserContext] Volunteer data loaded:', data[0]);
                setVolunteerData(data[0] as unknown as Volunteer);
            } else {
                console.warn('[UserContext] No volunteer found for email:', email);
            }
        } catch (err) {
            console.error('[UserContext] Unexpected error:', err);
        }
    };

    const login = async (email: string, role: User['role']) => {
        setLoading(true);
        // Real app would use Supabase Auth
        const newUser: User = {
            id: Math.random().toString(36).substr(2, 9),
            email,
            name: email.split('@')[0],
            role,
            riding_access: [],
            created_at: new Date().toISOString()
        };

        setUser(newUser);
        localStorage.setItem('bc_connect_user', JSON.stringify(newUser));

        if (role === 'volunteer') {
            await fetchVolunteerData(email);
        }

        setLoading(false);
    };

    const logout = () => {
        setUser(null);
        setVolunteerData(null);
        localStorage.removeItem('bc_connect_user');
    };

    const refreshVolunteerData = async () => {
        if (user?.email && user.role === 'volunteer') {
            await fetchVolunteerData(user.email);
        }
    };

    const value = {
        user,
        volunteerData,
        loading,
        login,
        logout,
        refreshVolunteerData,
        isAdmin: user?.role === 'admin',
        isDirector: user?.role === 'director',
        isVolunteer: user?.role === 'volunteer',
    };

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
