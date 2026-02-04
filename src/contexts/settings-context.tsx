"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

type Theme = 'light' | 'dark';

// Helper to convert hex to HSL string 'H S% L%'
function hexToHsl(hex: string): string | null {
    if (!hex.startsWith('#') || (hex.length !== 4 && hex.length !== 7)) {
        return null;
    }

    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.slice(1, 3), 16);
        g = parseInt(hex.slice(3, 5), 16);
        b = parseInt(hex.slice(5, 7), 16);
    }

    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);

    return `${h} ${s}% ${l}%`;
}

type Settings = {
    theme: Theme;
    pointsToWin: number;
    tieBreakPoints: number;
    teamABgColor: string; // hex
    teamAFgColor: string; // hex
    teamBBgColor: string; // hex
    teamBFgColor: string; // hex
};

type SettingsContextType = {
    settings: Settings;
    setSettings: (settings: Partial<Settings>) => void;
};

const defaultSettings: Settings = {
    theme: 'dark',
    pointsToWin: 25,
    tieBreakPoints: 15,
    teamABgColor: '#FFECEC',
    teamAFgColor: '#B92525',
    teamBBgColor: '#F0FAF8',
    teamBFgColor: '#2A9D8F',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettingsState] = useState<Settings>(defaultSettings);
    const { toast } = useToast();

    useEffect(() => {
        try {
            const storedSettings = localStorage.getItem('volley-counter-settings');
            if (storedSettings) {
                const parsedSettings = JSON.parse(storedSettings);
                // Basic validation and merging with defaults
                const mergedSettings = { ...defaultSettings, ...parsedSettings };
                if (mergedSettings.pointsToWin && mergedSettings.tieBreakPoints) {
                   setSettingsState(mergedSettings);
                }
            }
        } catch (error) {
            console.error("Failed to load settings from localStorage", error);
            setSettingsState(defaultSettings);
        }
    }, []);

    useEffect(() => {
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(settings.theme);

        const rootStyle = document.documentElement.style;
        const teamABgHsl = hexToHsl(settings.teamABgColor);
        const teamAFgHsl = hexToHsl(settings.teamAFgColor);
        const teamBBgHsl = hexToHsl(settings.teamBBgColor);
        const teamBFgHsl = hexToHsl(settings.teamBFgColor);
        
        if (teamABgHsl) rootStyle.setProperty('--card-a', teamABgHsl);
        if (teamAFgHsl) rootStyle.setProperty('--team-a-fg', teamAFgHsl);
        if (teamBBgHsl) rootStyle.setProperty('--card-b', teamBBgHsl);
        if (teamBFgHsl) rootStyle.setProperty('--team-b-fg', teamBFgHsl);
        
        try {
            localStorage.setItem('volley-counter-settings', JSON.stringify(settings));
        } catch (error) {
            console.error("Failed to save settings to localStorage", error);
        }
    }, [settings]);

    const handleSetSettings = useCallback((newSettings: Partial<Settings>) => {
        setSettingsState(prev => {
            const updatedSettings = { ...prev, ...newSettings };
            // Ensure points are numbers
            updatedSettings.pointsToWin = Number(updatedSettings.pointsToWin);
            updatedSettings.tieBreakPoints = Number(updatedSettings.tieBreakPoints);
            
            if (isNaN(updatedSettings.pointsToWin) || updatedSettings.pointsToWin <= 0) {
                updatedSettings.pointsToWin = defaultSettings.pointsToWin;
            }
            if (isNaN(updatedSettings.tieBreakPoints) || updatedSettings.tieBreakPoints <= 0) {
                updatedSettings.tieBreakPoints = defaultSettings.tieBreakPoints;
            }

            return updatedSettings;
        });
        toast({
            title: "Configurações Salvas!",
            description: "Suas novas configurações foram aplicadas.",
        });
    }, [toast]);

    return (
        <SettingsContext.Provider value={{ settings, setSettings: handleSetSettings }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (context === undefined) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
}
