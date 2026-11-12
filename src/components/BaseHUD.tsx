export default function BaseHUD() {
  return (
    <div className="absolute top-4 left-4 z-90 p-3 rounded-xl bg-black">
      <div className="flex flex-col gap-1">
        <h1 className="font-semibold text-white text-2xl leading-none">07:00</h1>
        <div className="relative w-38 bg-[#303030] h-4">
          <h1 className="absolute left-1 top-1/2 -translate-y-1/2 text-sm z-10">
            HP
          </h1>
          <div className="absolute top-0 left-0 w-1/2 h-full bg-[#D41313]" />
          <h1 className="absolute right-1 top-1/2 -translate-y-1/2 text-[12px] z-10">
            100%
          </h1>
        </div>
        <div className="relative w-48 bg-[#303030] h-4">
          <h1 className="absolute left-1 top-1/2 -translate-y-1/2 text-sm z-10">
            O2
          </h1>
          <div className="absolute top-0 left-0 w-1/2 h-full bg-[#1377D4]" />
          <h1 className="absolute right-1 top-1/2 -translate-y-1/2 text-[12px] z-10">
            100%
          </h1>
        </div>
        <div className="relative flex flex-col">
          <div className="relative w-70 bg-[#303030] h-8">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-[#FFB4A2]" />
          </div>
          <div className="w-70 flex flex-row justify-between items-center">
            <h1 className="font-semibold text-[#707070]">07:00</h1>
            <h1 className="font-semibold text-[#707070]">07:00</h1>
          </div>
        </div>
      </div>
    </div>
  );
}
