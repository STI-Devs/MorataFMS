import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { LoginForm } from "./LoginForm";
import { SignupForm } from "./SignupForm";

export const AuthPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const isLogin = location.pathname === "/login"; // Derived state
    const isAnimating = useRef(false); // Use ref to track animation state without re-renders
    const prevIsLogin = useRef(isLogin);

    useEffect(() => {
        if (prevIsLogin.current !== isLogin) {
            isAnimating.current = true;
            prevIsLogin.current = isLogin;
            setTimeout(() => {
                isAnimating.current = false;
            }, 600); // Match transition duration
        }
    }, [isLogin]);

    const toggleMode = (targetLogin: boolean) => {
        if (isAnimating.current) return;
        navigate(targetLogin ? "/login" : "/signup");
    };

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col overflow-hidden transition-colors">
            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-4 py-12 md:px-16">
                <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-[850px] min-h-[500px] flex relative overflow-hidden transition-all">

                    {/* Blue Panel (Absolute) */}
                    <div
                        className={`hidden md:block absolute top-0 left-0 w-1/2 h-full bg-[#1a2332] z-10 transition-transform duration-600 ease-in-out ${
                            isLogin ? "translate-x-full" : "translate-x-0"
                        }`}
                    ></div>

                    {/* Forms Container */}
                    <div className="flex w-full relative">
                        {/* Login Form (Left) */}
                        <div
                            className={`w-full md:w-1/2 px-8 py-10 md:px-14 flex flex-col ${
                                isLogin ? "flex" : "hidden md:flex"
                            }`}
                        >
                            {/* Logo */}
                            <div className="flex justify-center mb-8">
                                <div className="w-12 h-12 relative">
                                    <svg viewBox="0 0 64 64" className="w-full h-full">
                                        <circle cx="32" cy="32" r="30" fill="#1e3a5f" stroke="#c41e3a" strokeWidth="2" />
                                        <path d="M20 32 Q32 20 44 32 Q32 44 20 32" fill="#c41e3a" />
                                        <circle cx="32" cy="32" r="8" fill="white" />
                                        <path d="M28 28 L36 36 M36 28 L28 36" stroke="#1e3a5f" strokeWidth="2" />
                                    </svg>
                                </div>
                            </div>

                            <div className="text-center mb-6">
                                <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome!</h1>
                                <p className="text-gray-500 text-[10px] sm:text-xs">Your work, your team, your flow — all in one place.</p>
                            </div>

                            <LoginForm onToggleSignup={() => toggleMode(false)} />

                            {/* Footer Links */}
                            <div className="flex justify-center items-center space-x-3 text-[10px] text-gray-400 mt-auto pt-6">
                                <a href="#" className="hover:text-gray-600">Help</a>
                                <span>/</span>
                                <a href="#" className="hover:text-gray-600">Terms</a>
                                <span>/</span>
                                <a href="#" className="hover:text-gray-600">Privacy</a>
                            </div>
                        </div>

                        {/* Signup Form (Right) */}
                        <div
                            className={`w-full md:w-1/2 px-8 py-8 md:px-10 flex flex-col ${
                                !isLogin ? "flex" : "hidden md:flex"
                            }`}
                        >
                            {/* Logo */}
                            <div className="flex justify-center mb-4">
                                <div className="w-12 h-12 relative">
                                    <svg viewBox="0 0 64 64" className="w-full h-full">
                                        <circle cx="32" cy="32" r="30" fill="#1e3a5f" stroke="#c41e3a" strokeWidth="2" />
                                        <path d="M20 32 Q32 20 44 32 Q32 44 20 32" fill="#c41e3a" />
                                        <circle cx="32" cy="32" r="8" fill="white" />
                                        <path d="M28 28 L36 36 M36 28 L28 36" stroke="#1e3a5f" strokeWidth="2" />
                                    </svg>
                                </div>
                            </div>

                            <div className="text-center mb-6">
                                <h1 className="text-2xl font-bold text-gray-900">Create an account</h1>
                            </div>

                            <SignupForm onToggleLogin={() => toggleMode(true)} />

                            {/* Footer Links */}
                            <div className="flex justify-center items-center space-x-3 text-[10px] text-gray-400 mt-auto pt-6">
                                <a href="#" className="hover:text-gray-600">Help</a>
                                <span>/</span>
                                <a href="#" className="hover:text-gray-600">Terms</a>
                                <span>/</span>
                                <a href="#" className="hover:text-gray-600">Privacy</a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
