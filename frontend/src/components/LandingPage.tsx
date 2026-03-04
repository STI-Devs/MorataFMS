import { useNavigate } from 'react-router-dom';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="relative h-screen w-full bg-black overflow-hidden text-white" style={{ fontFamily: "'Montserrat', sans-serif" }}>

            {/* Background Image */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/85 z-10" />
                <img
                    src="/assets/landing-hero.jpg"
                    alt="Hero Background"
                    className="w-full h-full object-cover object-center"
                />
            </div>

            <div className="relative z-10 h-full flex flex-col">

                {/* Header */}
                <header className="container mx-auto px-6 py-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12">
                            <img src="/logo.jpg" alt="F.M. Morata Logo" className="w-full h-full object-cover rounded-full" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black leading-none text-white uppercase tracking-[0.2em]">F.M. MORATA</h1>
                            <p className="text-[10px] uppercase tracking-widest text-white/60 whitespace-nowrap">Customs Tracking &amp; File Management</p>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/login')}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm font-bold uppercase tracking-widest hover:bg-white/20 transition-all"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Sign In
                    </button>
                </header>

                {/* Hero Content */}
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

                        <button
                            onClick={() => navigate('/login')}
                            className="px-10 py-4 bg-white text-black font-black uppercase tracking-widest text-sm hover:bg-white/90 transition-all rounded-none"
                        >
                            Access System
                        </button>
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
