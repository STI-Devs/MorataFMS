import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
    const navigate = useNavigate();
    const [seconds, setSeconds] = useState(10);

    useEffect(() => {
        const timer = setInterval(() => {
            setSeconds((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);

        const redirect = setTimeout(() => {
            navigate('/dashboard');
        }, 10000);

        return () => {
            clearInterval(timer);
            clearTimeout(redirect);
        };
    }, [navigate]);

    return (
        <div className="fixed inset-0 z-[9999] bg-black overflow-hidden flex items-center justify-center">
            {/* Background */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50"
                style={{ backgroundImage: 'url("/404-bg.jpg")' }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />

            {/* Content */}
            <div className="relative z-10 text-white text-center px-6 max-w-xl">
                <div className="mb-6 flex justify-center">
                    <img src="/logo.jpg" alt="F.M Morata Logo" className="w-16 h-16 object-cover rounded-full border-2 border-white/30" />
                </div>

                <h1 className="text-[8rem] font-black leading-none tracking-tighter drop-shadow-2xl mb-2">404</h1>
                <h2 className="text-4xl font-light mb-4 drop-shadow-lg">Oops!</h2>
                <p className="text-lg text-white/80 leading-snug mb-8">
                    This page doesn't exist or you don't have access to it.
                    Redirecting to dashboard in <span className="font-bold text-white">{seconds}s</span>.
                </p>

                <button
                    onClick={() => navigate('/dashboard')}
                    className="px-8 py-3 border border-white rounded-full text-base font-medium hover:bg-white hover:text-black transition-all duration-300 active:scale-95"
                >
                    Back to Dashboard
                </button>
            </div>
        </div>
    );
};

export default NotFoundPage;
