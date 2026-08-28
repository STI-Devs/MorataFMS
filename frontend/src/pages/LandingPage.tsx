import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth';
import { getHomePath } from '../features/auth/utils/access';
import { landingHeroImage, logoImage } from '../assets/branding';
import { appRoutes } from '../lib/appRoutes';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '../components/ui/sheet';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();

    const handleHeaderAction = () => {
        if (isAuthenticated) {
            navigate(getHomePath(user));
        } else {
            navigate(appRoutes.login);
        }
    };

    return (
        <div className="relative h-svh w-full bg-black font-['Montserrat',sans-serif] overflow-hidden text-white">

            {/* Background Image Layer */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/85 z-10" />
                <img
                    src={landingHeroImage}
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
                            <img src={logoImage} alt="F.M. Morata Logo" className="w-full h-full object-cover rounded-full" />
                        </div>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-black leading-none text-white uppercase tracking-[0.12em] sm:tracking-[0.2em]">F.M. MORATA</h1>
                            <p className="hidden sm:block text-[12px] uppercase tracking-[0.2em] text-gray-300 font-bold whitespace-nowrap">CUSTOMS TRACKING &amp; FILE MANAGEMENT</p>
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
                        <Sheet>
                            <SheetTrigger asChild>
                                <button
                                    type="button"
                                    aria-label="Open menu"
                                    className="flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
                                    </svg>
                                </button>
                            </SheetTrigger>
                            <SheetContent
                                side="right"
                                className="flex w-full flex-col gap-0 bg-black/95 text-white backdrop-blur-xl sm:w-[400px] sm:max-w-[400px]"
                            >
                                <SheetHeader className="border-b border-white/10 px-5 py-4">
                                    <SheetTitle className="font-black uppercase tracking-[0.2em] text-white">Menu</SheetTitle>
                                </SheetHeader>
                                <nav className="flex-1 overflow-y-auto px-2 py-3">
                                    <ul className="flex flex-col gap-1">
                                        {[
                                            { label: 'Home', href: '#top' },
                                            { label: 'Services', href: '#services' },
                                            { label: 'About', href: '#about' },
                                            { label: 'Contact', href: '#contact' },
                                        ].map((link) => (
                                            <li key={link.label}>
                                                <SheetClose asChild>
                                                    <a href={link.href} className="flex items-center justify-between rounded-md px-4 py-3 text-sm font-bold uppercase tracking-[0.2em] text-white/80 transition-colors hover:bg-white/10 hover:text-white">
                                                        {link.label}
                                                        <span aria-hidden="true" className="text-white/30">→</span>
                                                    </a>
                                                </SheetClose>
                                            </li>
                                        ))}
                                    </ul>
                                </nav>
                                <SheetFooter className="border-t border-white/10 bg-black/60 px-5 py-4">
                                    <button
                                        type="button"
                                        onClick={handleHeaderAction}
                                        className="w-full border border-white/30 bg-white/10 px-4 py-3 text-xs font-black uppercase tracking-[0.3em] text-white transition-colors hover:bg-white hover:text-black"
                                    >
                                        {isAuthenticated ? 'Open App' : 'Sign In'}
                                    </button>
                                </SheetFooter>
                            </SheetContent>
                        </Sheet>
                    </div>
                </header>

                {/* Main Hero Content */}
                <main className="flex-1 container mx-auto px-6 sm:px-8 md:px-12 flex flex-col justify-center pb-20">
                    <div className="max-w-5xl">
                        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-black leading-[0.95] mb-4 tracking-[0.08em] sm:tracking-[0.15em] lg:tracking-[0.2em] uppercase">
                            FELY M. MORATA
                        </h1>
                        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold leading-none mb-10 tracking-[0.08em] sm:tracking-[0.15em] lg:tracking-[0.2em] uppercase text-white/90">
                            CUSTOMS BROKERAGE <br /> <span className="text-white/60">&amp; LAW FIRM</span>
                        </h2>
                        <p className="text-base sm:text-lg md:text-xl font-bold text-white/80 mt-10 mb-14 max-w-2xl leading-relaxed tracking-[0.08em] sm:tracking-[0.15em] lg:tracking-[0.2em] uppercase">
                            Results Driven, with Integrity
                        </p>
                    </div>
                </main>

                {/* Footer */}
                <footer className="absolute bottom-10 left-0 w-full px-6 sm:px-8 md:px-12">
                    <div className="container mx-auto flex flex-col md:flex-row justify-between items-end gap-8">
                        <div className="hidden lg:flex flex-col gap-1 text-white/60 uppercase tracking-[0.3em] text-xs font-bold">
                            <span>EST. 2002</span>
                            <span>DAVAO CITY, PH</span>
                        </div>
                        <div className="text-right flex flex-col items-end">
                            <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.08em] sm:tracking-widest text-white mb-1">© 2026 F.M. Morata — All rights reserved</p>
                            <p className="text-[10px] uppercase tracking-[0.1em] sm:tracking-[0.2em] text-white/40 font-black">Cargo images are designer impressions</p>
                        </div>
                    </div>
                </footer>

            </div>
        </div>
    );
};

export default LandingPage;

