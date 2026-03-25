export const UI = () => {
  return (
    <section className="fixed inset-0 z-10 flex items-center justify-center pointer-events-none">
      <div className="absolute top-4 left-4 md:top-8 md:left-14 opacity-0 animate-fade-in-down animation-delay-200 pointer-events-auto bg-white px-5 py-1 rounded-xl">
        <a href="#" target="_blank">
          <div className="flex items-center gap-3">
            <img
              src="/images/logoFibo.png"
              alt="Wawa Sensei logo"
              className="w-20 h-20 object-contain"
            />
            <div className="flex flex-col gap-1">
              <p className="text-3xl font-semibold text-[#0fc1f7] tracking-wider">Fibonax</p>
              <p className="text-lg font-semibold text-[#0fc1f7] tracking-widest">Technologies</p>
            </div>
          </div>
        </a>
      </div>
      <div className="absolute left-4 md:left-15 -translate-x-1/2 -rotate-90 flex items-center gap-4 animation-delay-1500 animate-fade-in-down opacity-0">
        <div className="w-20 h-px bg-white/60"></div>
        <p className="text-white/60 text-xs">🎙️ Become a pop star ⭐️</p>
      </div>
    </section>
  );
};
