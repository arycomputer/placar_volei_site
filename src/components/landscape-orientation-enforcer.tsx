"use client";

import { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';

export default function LandscapeOrientationEnforcer({ children }: { children: React.ReactNode }) {
    const [showOverlay, setShowOverlay] = useState(false);

    useEffect(() => {
        const portraitMediaQuery = window.matchMedia("(orientation: portrait)");
        const mobileMediaQuery = window.matchMedia("(max-width: 767px)");

        const handleMediaChange = () => {
            setShowOverlay(mobileMediaQuery.matches && portraitMediaQuery.matches);
        };

        handleMediaChange();

        portraitMediaQuery.addEventListener("change", handleMediaChange);
        mobileMediaQuery.addEventListener("change", handleMediaChange);

        return () => {
            portraitMediaQuery.removeEventListener("change", handleMediaChange);
            mobileMediaQuery.removeEventListener("change", handleMediaChange);
        };
    }, []);

    if (showOverlay) {
        return (
            <div className="fixed inset-0 z-[101] flex h-screen w-screen flex-col items-center justify-center bg-background text-center text-foreground p-4">
                <Smartphone className="h-16 w-16 mb-4 animate-pulse" />
                <h1 className="text-2xl font-bold">Please Rotate Your Device</h1>
                <p className="mt-2 text-muted-foreground">This application is best viewed in landscape mode.</p>
            </div>
        );
    }

    return <>{children}</>;
}
