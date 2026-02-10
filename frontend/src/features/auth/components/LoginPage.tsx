//import { useLocation } from "react-router-dom";
import { LoginForm } from "./LoginForm";

export const LoginPage = () => {
  //const location = useLocation();

  // Toast disabled per user request until role system is established
  // useEffect(() => {
  //   if (location.state?.from) {
  //     toast.error("Please log in to access that page.", {
  //       id: "auth-required", // Prevent duplicates
  //       duration: 4000,
  //     });
  //   }
  // }, [location]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0A1929]">
      {/* Professional Background Pattern */}
      <div className="absolute inset-0">
        {/* Diagonal lines pattern */}
        <div 
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 35px,
              rgba(255, 255, 255, 0.1) 35px,
              rgba(255, 255, 255, 0.1) 70px
            )`
          }}
        />
        
        {/* Subtle red accent glow - top right */}
        <div 
          className="absolute top-0 right-0 w-96 h-96 bg-red-600 rounded-full mix-blend-soft-light filter blur-3xl opacity-20"
        />
        
        {/* Subtle blue accent glow - bottom left */}
        <div 
          className="absolute bottom-0 left-0 w-96 h-96 bg-blue-600 rounded-full mix-blend-soft-light filter blur-3xl opacity-20"
        />
      </div>

      {/* Main Content */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        {/* Glassmorphism Card */}
        <div 
          className="w-full max-w-md"
          style={{ animation: 'fade-in 0.8s ease-out' }}
        >
          <div className="backdrop-blur-xl bg-white/5 rounded-3xl shadow-2xl border border-white/10 p-8 md:p-10">
            {/* Logo/Brand Section */}
            <div className="text-center mb-8">
              {/* FM Morata Logo */}
              <div className="inline-flex items-center justify-center mb-6">
                <div className="text-center">
                  <h1 className="text-4xl font-bold mb-1">
                    <span className="text-red-500">F.M. MORATA</span>
                  </h1>
                  <p className="text-blue-400 text-sm font-semibold tracking-wide">
                    Customs Brokerage and Law Firm
                  </p>
                </div>
              </div>
              
              <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent mb-6"></div>
            </div>

            {/* Login Form */}
            <LoginForm />

            {/* Footer Links */}
            <div className="mt-6 text-center">
              <p className="text-white/50 text-sm">
                Need access?{' '}
                <a href="#" className="text-red-400 font-semibold hover:text-red-300 transition-colors">
                  Contact Administrator
                </a>
              </p>
            </div>
          </div>

          {/* Subtle bottom text */}
          <p className="text-center text-white/40 text-xs mt-6">
            © 2026 F.M. Morata Customs Brokerage and Law Firm. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};