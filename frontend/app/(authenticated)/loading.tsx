export default function AuthenticatedLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] w-full py-16 animate-in fade-in duration-200 select-none">
      <div className="relative flex items-center justify-center">
        {/* Glowing aura */}
        <div className="absolute w-16 h-16 rounded-full bg-blue-500/10 blur-xl animate-pulse" />
        
        {/* Outer spinning ring */}
        <div className="w-12 h-12 rounded-full border-[3px] border-blue-100 border-t-[#0260de] animate-spin" />
        
        {/* Inner brand emblem */}
        <div className="absolute w-6 h-6 rounded-xl bg-[#0260de] text-white flex items-center justify-center text-[10px] font-black shadow-xs">
          SV
        </div>
      </div>

      <div className="mt-5 text-center">
        <p className="text-sm font-extrabold text-[#0f172a] tracking-tight">
          Loading page...
        </p>
        <p className="text-xs text-[#64748b] mt-0.5 font-medium">
          Fetching records and preparing view
        </p>
      </div>
    </div>
  );
}
