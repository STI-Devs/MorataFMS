import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();

    const handleHeaderAction = () => {
        if (isAuthenticated) {
            navigate(user?.role === 'admin' ? '/transactions' : '/tracking');
        } else {
            navigate('/login');
        }
    };

    return (
        <div className="relative h-screen w-full bg-black font-['Montserrat',sans-serif] overflow-hidden text-white">

            {/* Background Image Layer */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/85 z-10" />
                <img
                    src="/assets/landing-hero.jpg"
                    alt="Hero Background"
                    className="w-full h-full object-cover object-center"
                />
            </div>

            {/* Content Container */}
            <div className="relative z-10 h-full flex flex-col">

                {/* Navigation Header */}
                <header className="container mx-auto px-6 py-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12">
                            <img src="/logo.jpg" alt="F.M. Morata Logo" className="w-full h-full object-cover rounded-full" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black leading-none text-white uppercase tracking-[0.2em]">F.M. MORATA</h1>
                            <p className="text-[12px] uppercase tracking-[0.2em] text-gray-300 font-bold whitespace-nowrap">CUSTOMS TRACKING &amp; FILE MANAGEMENT</p>
                        </div>
                    </div>

                    {/* Auth action — top right */}
                    <div className="relative hidden md:block">
                        {isAuthenticated ? (
                            // Logged in → "Open App" + arrow icon
                            <button
                                onClick={handleHeaderAction}
                                className="flex items-center gap-3 focus:outline-none group hover:opacity-80 transition-opacity"
                            >
                                <p className="text-base font-bold text-white leading-tight">Open App</p>
                                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-white/20 shadow-lg group-hover:bg-white/20 transition-all">
                                    <svg className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                    </svg>
                                </div>
                            </button>
                        ) : (
                            // Not logged in → Sign In
                            <button
                                onClick={handleHeaderAction}
                                className="flex items-center gap-3 focus:outline-none group hover:opacity-80 transition-opacity"
                            >
                                <p className="text-base font-bold text-white leading-tight">Sign In</p>
                                <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white border border-white/20 shadow-lg group-hover:bg-white/20 transition-all">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                            </button>
                        )}
                    </div>

                    <div className="md:hidden">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                        </svg>
                    </div>
                </header>

                {/* Main Hero Content */}
                <main className="flex-1 container mx-auto px-8 md:px-12 flex flex-col justify-center pb-20">
                    <div className="max-w-5xl">
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-black leading-[0.9] mb-4 tracking-[0.2em] uppercase">
                            FELY M. MORATA
                        </h1>
                        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-none mb-10 tracking-[0.2em] uppercase text-white/90">
                            CUSTOMS BROKERAGE <br /> <span className="text-white/60">&amp; LAW FIRM</span>
                        </h2>
                        <p className="text-lg md:text-xl font-bold text-white/80 mt-10 mb-14 max-w-2xl leading-relaxed tracking-[0.2em] uppercase">
                            Results Driven, with Integrity
                        </p>
                    </div>
                </main>

                {/* Footer */}
                <footer className="absolute bottom-10 left-0 w-full px-8 md:px-12">
                    <div className="container mx-auto flex flex-col md:flex-row justify-between items-end gap-8">
                        <div className="hidden lg:flex flex-col gap-1 text-white/60 uppercase tracking-[0.3em] text-xs font-bold">
                            <span>EST. 2002</span>
                            <span>DAVAO CITY, PH</span>
                        </div>
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
