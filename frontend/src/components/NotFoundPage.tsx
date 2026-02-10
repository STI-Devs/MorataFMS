export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#0A1929] flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-9xl font-black text-white/10 select-none">404</h1>
      
      <div className="-mt-12 space-y-6 relative z-10">
        <h2 className="text-3xl font-bold text-white tracking-tight">
          Lost Cargo
        </h2>
        <p className="text-white/60 text-lg max-w-sm mx-auto">
          We couldn't find the page or shipment you're looking for.
        </p>
      </div>

      <div className="absolute bottom-8 text-white/20 text-xs">
        F.M. Morata Customs Brokerage
      </div>
    </div>
  );
}
