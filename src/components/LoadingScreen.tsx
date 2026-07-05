import { useEffect, useState } from 'react';
import { getRandomQuote } from '../data/quotes';

export default function LoadingScreen() {
    const [quote, setQuote] = useState(() => getRandomQuote());
    const [fade, setFade] = useState(true);

    useEffect(() => {
        const interval = setInterval(() => {
            setFade(false);
            setTimeout(() => {
                setQuote(q => getRandomQuote(q.text));
                setFade(true);
            }, 300);
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="loading-screen">
            <div className="loading-screen__blob loading-screen__blob--1" />
            <div className="loading-screen__blob loading-screen__blob--2" />

            <img src="/logo.png" alt="GYM+" className="loading-screen__logo" />

            <div className="loading-screen__dots">
                <span /><span /><span />
            </div>

            <div className={`loading-screen__quote ${fade ? 'loading-screen__quote--visible' : ''}`}>
                <p className="loading-screen__quote-text">„{quote.text}”</p>
                <p className="loading-screen__quote-author">— {quote.author}</p>
            </div>
        </div>
    );
}
