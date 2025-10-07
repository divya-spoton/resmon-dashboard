// ThemeContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [isDark, setIsDark] = useState(() => {
        try {
            const saved = localStorage.getItem('theme');
            return saved ? saved === 'dark' : false; // Default to light
        } catch (e) {
            return false;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        } catch (e) {
            // ignore localStorage failures
        }
    }, [isDark]);

    const toggleTheme = () => setIsDark((s) => !s);

    const theme = {
        isDark,
        toggleTheme,
        colors: isDark
            ? {
                // layout / surfaces
                bg: 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900',
                cardBg: 'bg-slate-800/50',
                cardBorder: 'border-slate-700',
                text: 'text-white',
                textSecondary: 'text-slate-400',
                textTertiary: 'text-slate-300',
                inputBg: 'bg-slate-900',
                inputBorder: 'border-slate-700',
                tableBg: 'bg-slate-900/50',
                hoverBg: 'hover:bg-slate-700/30',

                // chart tokens (non-tailwind)
                chartGrid: '#334155',
                chartAxis: '#94a3b8',

                // tokens we moved into theme for consistency
                divide: 'divide-slate-700',         // use together with `divide-y`
                batteryTrack: 'bg-slate-700',      // battery track / background
                batteryFill: 'bg-green-500',       // battery fill
                statusActive: 'bg-green-500/20 text-green-400',
                statusInactive: 'bg-red-500/20 text-red-400'
            }
            : {
                // light mode equivalents
                bg: 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100',
                cardBg: 'bg-white',
                cardBorder: 'border-gray-200',
                text: 'text-gray-900',
                textSecondary: 'text-gray-600',
                textTertiary: 'text-gray-700',
                inputBg: 'bg-gray-50',
                inputBorder: 'border-gray-300',
                tableBg: 'bg-gray-50',
                hoverBg: 'hover:bg-gray-50',

                chartGrid: '#e5e7eb',
                chartAxis: '#6b7280',

                // moved tokens for light mode
                divide: 'divide-gray-200',
                batteryTrack: 'bg-gray-200',
                batteryFill: 'bg-green-600',
                statusActive: 'bg-green-100 text-green-800',
                statusInactive: 'bg-red-100 text-red-800'
            }
    };

    return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
};
