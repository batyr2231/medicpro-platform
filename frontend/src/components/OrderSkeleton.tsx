export default function OrderSkeleton() {
  return (
    <div className="rounded-2xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 p-6 animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-white/20"></div>
          <div>
            <div className="h-5 w-32 bg-white/20 rounded mb-2"></div>
            <div className="h-4 w-24 bg-white/20 rounded"></div>
          </div>
        </div>
        <div className="h-8 w-20 bg-white/20 rounded"></div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded bg-white/20"></div>
          <div className="h-4 w-40 bg-white/20 rounded"></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded bg-white/20"></div>
          <div className="h-4 w-48 bg-white/20 rounded"></div>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-6 h-6 rounded bg-white/20"></div>
          <div className="h-4 w-36 bg-white/20 rounded"></div>
        </div>
      </div>

      {/* Button */}
      <div className="mt-4 h-12 w-full bg-white/20 rounded-xl"></div>
    </div>
  );
}