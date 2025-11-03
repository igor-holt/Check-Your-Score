import React, { useEffect, useRef } from 'react';

const MatrixBackground: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        const columns = Math.floor(width / 20);
        const drops = Array(columns).fill(1);
        
        // Katakana characters, numbers, and symbols
        const characters = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブプエェケセテネヘメレヱゲゼデベペオォコソトノホモヨョロヲゴゾドボポヴッン0123456789';

        const draw = () => {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, width, height);
            
            ctx.fillStyle = '#0F0'; // Green text
            ctx.font = '15px monospace';

            for(let i = 0; i < drops.length; i++) {
                const text = characters[Math.floor(Math.random() * characters.length)];
                ctx.fillText(text, i * 20, drops[i] * 20);

                if(drops[i] * 20 > height && Math.random() > 0.975) {
                    drops[i] = 0;
                }
                drops[i]++;
            }
        };

        const intervalId = setInterval(draw, 33);

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            drops.fill(1);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            clearInterval(intervalId);
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    return <canvas ref={canvasRef} className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none" />;
};

export default MatrixBackground;
