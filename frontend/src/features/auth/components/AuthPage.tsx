import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { LoginForm } from "./LoginForm";

export const AuthPage = () => {
    const navigate = useNavigate();
    const { isAuthenticated, isLoading } = useAuth();

    useEffect(() => {
        if (!isLoading && isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, isLoading, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center p-6 relative bg-black">
            {/* Back Button */}
            <button
                onClick={() => navigate('/')}
                className="absolute top-8 left-8 z-30 flex items-center gap-3 text-white/40 hover:text-white transition-all duration-300 group cursor-pointer"
            >
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:border-white/30 group-hover:bg-white/5 transition-all duration-300 backdrop-blur-sm">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-[0.3em] font-bold leading-none">Back</span>
                    <span className="text-[8px] uppercase tracking-[0.1em] text-white/20 group-hover:text-white/40 transition-colors">to home</span>
                </div>
            </button>
            {/* Full-page background */}
            <div className="fixed inset-0 z-0">
                <img
                    src="/assets/landing-hero.jpg"
                    alt="Background"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60" />
            </div>

            {/* Frame / Card */}
            <div className="relative z-10 w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl flex min-h-[560px]">

                {/* Left — Branding panel */}
                <div
                    className="hidden lg:flex flex-col justify-end flex-1 relative p-12"
                    style={{ backdropFilter: 'blur(2px) brightness(0.4)', WebkitBackdropFilter: 'blur(2px) brightness(0.4)' }}
                >
                    <div className="absolute inset-0 bg-black/10" />
                    <div className="relative z-10">
                        <h1 className="text-4xl font-black text-white leading-tight mb-3 tracking-[0.05em] drop-shadow-lg">
                            Welcome!
                        </h1>
                        <p className="text-white/70 text-xs leading-relaxed tracking-[0.1em] font-light max-w-xs drop-shadow">
                            Your work, your team, your flow — all in one place.
                        </p>
                    </div>
                    <p className="relative z-10 text-white/40 text-[9px] uppercase tracking-[0.4em] font-semibold mt-10">
                        © 2026 F.M. Morata
                    </p>
                </div>

                {/* Vertical divider */}
                <div className="hidden lg:block w-px bg-white/10 flex-shrink-0" />

                {/* Right — Form panel */}
                <div className="w-full lg:w-[420px] flex-shrink-0 bg-black/80 backdrop-blur-sm flex flex-col">
                    <div className="flex-1 flex items-center w-full px-10 py-12">
                        <div className="w-full">
                            <h2 className="text-2xl font-black text-white mb-8 tracking-[0.05em]">
                                Login
                            </h2>
                            <LoginForm />
                        </div>
                    </div>
                    {/* Help — pinned to very bottom */}
                    <div className="text-center pb-6">
                        <a href="#" className="text-[9px] uppercase tracking-[0.4em] font-semibold text-white/25 hover:text-white/60 transition-colors">Help</a>
                    </div>
                </div>

            </div>
        </div>
    );
};
