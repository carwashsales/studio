'use client';

import * as React from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';

export function CurrencySymbol() {
    const { theme } = useTheme();
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        // Render a placeholder or nothing on the server to avoid hydration mismatch
        return <span className="inline-block w-4 h-4" />;
    }

    const src = theme === 'dark' ? '/sarwhite1.png' : '/sar.png';

    return (
        <Image 
            src={src} 
            alt="SAR" 
            width={16} 
            height={16}
            className="inline-block" 
        />
    );
}
