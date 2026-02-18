import React, { useEffect, useState } from 'react';
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
    <div className="fixed inset-0 z-[9999] bg-black overflow-hidden flex items-center justify-center font-sans tracking-tight">
      {/* Background Image: Cargo Ship */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60 transition-opacity duration-1000"
        style={{ backgroundImage: 'url("/404-bg.jpg")' }}
      />

      {/* Gradient Overlay for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-black/60" />

      <div className="container mx-auto px-6 max-w-6xl flex flex-col md:flex-row items-center justify-between relative z-10">

        {/* Left Side: Static Circular Logo Placeholder */}
        <div className="flex-1 flex justify-start items-center pl-8">
          <div className="w-48 h-48 md:w-64 md:h-64 relative flex items-center justify-center">
            <div className="w-full h-full border-2 border-dashed border-white/40 rounded-full flex items-center justify-center bg-white/10 backdrop-blur-sm shadow-[0_0_30px_rgba(255,255,255,0.2)]">
              <img src="/logo.jpg" alt="F.M Morata Logo" className="w-full h-full object-cover rounded-full" />
            </div>
          </div>
        </div>

        {/* Right Side: Text Content */}
        <div className="flex-1 text-white flex flex-col items-center md:items-start text-center md:text-left pr-12">
          <h2 className="text-5xl md:text-6xl font-normal mb-1 drop-shadow-lg">Oops!</h2>

          <div className="flex items-center mb-4 -ml-2">
            <h1 className="text-[10rem] md:text-[12rem] font-bold leading-none tracking-tighter drop-shadow-2xl">404</h1>
          </div>

          <div className="max-w-md space-y-4">
            <p className="text-xl md:text-2xl font-light text-white leading-snug drop-shadow-md">
              Your page is currently under maintenance and will guide you back to the homepage after <span className="font-bold text-white inline-block min-w-[1.2rem] text-center">{seconds}</span> seconds.
            </p>

            <div className="pt-6">
              <button
                onClick={() => navigate('/dashboard')}
                className="px-12 py-3 border border-white rounded-full text-lg font-medium hover:bg-white hover:text-black transition-all duration-300 transform active:scale-95 bg-black/30 backdrop-blur-sm shadow-lg"
              >
                Back to home
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
                @keyframes stars-fade {
                    0%, 100% { opacity: 0.1; transform: scale(0.8); }
                    50% { opacity: 0.6; transform: scale(1.2); }
                }
            `}</style>
    </div>
  );
};

export default NotFoundPage;
