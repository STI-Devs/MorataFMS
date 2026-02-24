import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../features/auth';

const LandingPage: React.FC = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // Default values if user is not logged in
    const userName = user?.name === 'Admin User' ? 'Test User' : (user?.name || 'Test User');
    const userRole = 'Document In Charge';
    const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const [showDropdown, setShowDropdown] = useState(false);
    const { login, logout, setUser } = useAuth();

    const handleSwitchAccount = async (email: string) => {
        try {
            await logout();
            try {
                await login({ email, password: 'password' });
            } catch (err) {
                console.warn('API Login failed, using mock user for demo/testing');
                const mockUser = {
                    id: email === 'admin@morata.com' ? 1 : 2,
                    email: email,
                    name: email === 'admin@morata.com' ? 'Admin User' : 'Test User',
                    role: email === 'admin@morata.com' ? 'Admin' : 'Encoder'
                };
                setUser(mockUser);
                localStorage.setItem('user', JSON.stringify(mockUser));
            }

            if (email === 'admin@morata.com') {
                navigate('/dashboard');
            } else {
                navigate('/imports');
            }
        } catch (error) {
            console.error('Failed to switch account:', error);
        }
    };

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

                    <div className="relative">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="hidden md:flex items-center gap-6 focus:outline-none group"
                        >
                            <div className="text-right group-hover:opacity-80 transition-opacity">
                                <p className="text-base font-bold text-white leading-tight">{userName}</p>
                                <p className="text-xs text-gray-300 uppercase tracking-wider">{userRole}</p>
                            </div>
                            <div className="w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white font-bold text-lg border border-white/20 shadow-lg group-hover:bg-white/20 transition-all">
                                {initials}
                            </div>
                        </button>

                        {showDropdown && (
                            <div className="absolute right-0 top-full mt-4 w-56 bg-white rounded-2xl shadow-2xl py-2 z-50 overflow-hidden transform origin-top-right transition-all">
                                <div className="px-4 py-3 border-b border-gray-100">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Switch Account</p>
                                </div>
                                <button
                                    onClick={() => handleSwitchAccount('admin@morata.com')}
                                    className="w-full text-left px-4 py-3 hover:bg-black/5 font-bold text-sm text-gray-900 flex items-center gap-3 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="leading-none">Admin User</p>
                                        <p className="text-[10px] text-gray-500 font-normal mt-0.5">Switch to admin view</p>
                                    </div>
                                </button>
                                <button
                                    onClick={() => handleSwitchAccount('test@morata.com')}
                                    className="w-full text-left px-4 py-3 hover:bg-black/5 font-bold text-sm text-gray-900 flex items-center gap-3 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="leading-none">Test User</p>
                                        <p className="text-[10px] text-gray-500 font-normal mt-0.5">Switch to user view</p>
                                    </div>
                                </button>
                            </div>
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
                                onClick={() => navigate('/tracking')}
                                className="px-12 py-6 bg-white text-black rounded-full text-xl font-black tracking-wide hover:bg-gray-200 transition-all transform hover:scale-105 shadow-2xl"
                            >
                                TRACKING NOW
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
