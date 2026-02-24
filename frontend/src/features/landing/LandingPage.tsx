import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // If already logged in, redirect away from landing page
    if (user) {
        navigate('/dashboard', { replace: true });
        return null;
    }

    return (

        <div className="relative h-screen w-full bg-black font-sans overflow-hidden text-white">
            {/* Background Image Layer */}
            <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-[20s] hover:scale-110"
                style={{
                    backgroundImage: 'url("/assets/landing-hero.jpg")',
                }}
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

            {/* Content Container */}
            <div className="relative z-10 h-full flex flex-col">
                {/* Navigation Header */}
                <header className="container mx-auto px-6 py-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12">
                            <img src="/logo.jpg" alt="F.M. Morata Logo" className="w-full h-full object-cover rounded-full" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black leading-none text-white uppercase tracking-wider">F.M. MORATA</h1>
                            <p className="text-[12px] uppercase tracking-[0.2em] text-gray-300 font-bold whitespace-nowrap">customs tracking & file management</p>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/login')}
                        className="hidden md:flex items-center gap-2 px-6 py-2.5 bg-white/10 backdrop-blur-sm border border-white/30 text-white rounded-full text-sm font-bold tracking-wide hover:bg-white/20 transition-all"
                    >
                        Sign In
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                    </button>

                    <div className="md:hidden">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                    </div>
                </header>

                {/* Main Hero Content */}
                <main className="flex-1 container mx-auto px-8 md:px-12 flex flex-col justify-center pb-20">
                    <div className="max-w-5xl">
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-black leading-[0.9] mb-4 tracking-tighter uppercase">
                            Fely M. Morata
                        </h1>
                        <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold leading-none mb-10 tracking-tight uppercase text-white/90">
                            Customs Brokerage <br /> <span className="text-white/60">& Law Firm</span>
                        </h2>
                        <p className="text-xl md:text-2xl font-light text-white/80 mb-14 max-w-2xl leading-relaxed italic">
                            Your work, your team, your flow — all in one place.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-6 items-start">
                            <button
                                onClick={() => navigate('/login')}
                                className="px-12 py-6 bg-white text-black rounded-full text-xl font-black tracking-wide hover:bg-gray-200 transition-all transform hover:scale-105 shadow-2xl"
                            >
                                SIGN IN
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="px-12 py-6 bg-white/10 backdrop-blur-md border border-white/30 text-white rounded-full text-xl font-bold tracking-wide hover:bg-white/20 transition-all hover:scale-105"
                            >
                                DASHBOARD
                            </button>
                        </div>
                    </div>
                </main>

                {/* Footer / Decorative Elements */}
                <footer className="absolute bottom-10 left-0 w-full px-8 md:px-12">
                    <div className="container mx-auto flex flex-col md:flex-row justify-between items-end gap-8">
                        {/* Decorative Info */}
                        <div className="hidden lg:flex flex-col gap-1 text-white/60 uppercase tracking-[0.3em] text-xs font-bold">
                            <span>EST. 2002</span>
                            <span>DAVAO CITY, PH</span>
                        </div>

                        {/* Copyright */}
                        <div className="text-right flex flex-col items-end">
                            <p className="text-sm font-bold uppercase tracking-widest text-white mb-1">© 2026 F.M. Morata — All rights reserved</p>
                            <p className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-black">Cargo images are designer impressions</p>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default LandingPage;
