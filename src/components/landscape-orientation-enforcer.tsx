"use client";

import { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';

export default function LandscapeOrientationEnforcer({ children }: { children: React.ReactNode }) {
    const [showOverlay, setShowOverlay] = useState(false);

    useEffect(() => {
        const portraitMediaQuery = window.matchMedia("(orientation: portrait)");

        const handleMediaChange = () => {
            setShowOverlay(portraitMediaQuery.matches);
        };

        handleMediaChange();

        portraitMediaQuery.addEventListener("change", handleMediaChange);

        return () => {
            portraitMediaQuery.removeEventListener("change", handleMediaChange);
        };
    }, []);

    if (showOverlay) {
        return (
            <div className="fixed inset-0 z-[101] flex h-screen w-screen flex-col items-center justify-center bg-background text-center text-foreground p-4">
                <Smartphone className="h-16 w-16 mb-4 animate-pulse" />
                <h1 className="text-2xl font-bold">Por Favor, Use o Modo Paisagem</h1>
                <p className="mt-2 text-muted-foreground">Esta aplicação foi projetada para uma melhor experiência no modo paisagem.</p>
            </div>
        );
    }

    return <>{children}</>;
}
