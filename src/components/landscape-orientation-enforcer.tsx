"use client";

import { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';

export default function LandscapeOrientationEnforcer({ children }: { children: React.ReactNode }) {
    const [isPortrait, setIsPortrait] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            // Show overlay if height is greater than width
            setIsPortrait(window.innerHeight > window.innerWidth);
        };

        handleResize(); // Initial check
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    if (isPortrait) {
        return (
            <div className="fixed inset-0 z-[101] flex h-screen w-screen flex-col items-center justify-center bg-background p-4 text-center text-foreground">
                <Smartphone className="h-16 w-16 mb-4 animate-pulse" />
                <h1 className="text-2xl font-bold">Por Favor, Use o Modo Paisagem</h1>
                <p className="mt-2 text-muted-foreground">
                    Para uma melhor experiência, por favor, gire seu dispositivo ou redimensione a janela.
                </p>
            </div>
        );
    }

    return <>{children}</>;
}
