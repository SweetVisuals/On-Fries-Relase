import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export const CookieConsent: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Check if user has already made a choice
        const consent = localStorage.getItem('cookie-consent');
        if (!consent) {
            // Show banner if no choice is stored
            // Small delay to make it slide in nicely
            const timer = setTimeout(() => setIsVisible(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleAccept = () => {
        localStorage.setItem('cookie-consent', 'accepted');
        setIsVisible(false);
    };

    const handleDecline = () => {
        localStorage.setItem('cookie-consent', 'declined');
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
            <div className="max-w-4xl mx-auto bg-zinc-900 border border-zinc-800 rounded-xl p-4 md:p-6 shadow-2xl flex flex-col md:flex-row items-center gap-4 md:gap-8">
                <div className="flex-1 text-center md:text-left">
                    <h3 className="text-white font-bold mb-1">We value your privacy</h3>
                    <p className="text-zinc-400 text-sm">
                        We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic. By clicking "Accept", you consent to our use of cookies.
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <button
                        onClick={handleDecline}
                        className="flex-1 md:flex-none px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-colors text-sm font-medium whitespace-nowrap"
                    >
                        Decline
                    </button>
                    <button
                        onClick={handleAccept}
                        className="flex-1 md:flex-none px-6 py-2 rounded-lg bg-brand-yellow text-black hover:bg-yellow-400 transition-colors text-sm font-bold whitespace-nowrap shadow-lg shadow-yellow-900/20"
                    >
                        Accept
                    </button>
                </div>
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute top-2 right-2 p-1 text-zinc-500 hover:text-zinc-300 md:hidden"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};
