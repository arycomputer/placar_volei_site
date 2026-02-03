"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

type Theme = 'light' | 'dark';

type Settings = {
    theme: Theme;
    pointsToWin: number;
    tieBreakPoints: number;
};

type SettingsContextType = {
    settings: Settings;
    setSettings: (settings: Partial<Settings>) => void;
};

const defaultSettings: Settings = {
    theme: 'dark',
    pointsToWin: 25,
    tieBreakPoints: 15,
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
                // Basic validation to avoid breaking the app with bad stored data
                if (parsedSettings.pointsToWin && parsedSettings.tieBreakPoints) {
                   setSettingsState(parsedSettings);
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
