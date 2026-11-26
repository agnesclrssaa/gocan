function SkeletonBlock({ className = '' }) {
  return <div className={`gocan-skeleton-block ${className}`} aria-hidden="true" />;
}

function SkeletonCard({ variant }) {
  if (variant === 'table') {
    return (
      <div className="grid grid-cols-5 gap-4 border-b border-slate-100 px-4 py-4">
        {Array.from({ length: 5 }, (_, index) => (
          <SkeletonBlock key={index} className={`h-4 ${index === 0 ? 'w-8' : 'w-full'}`} />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      {variant !== 'order' && <SkeletonBlock className={`w-full ${variant === 'menu' ? 'h-40' : 'h-32'}`} />}
      <div className="space-y-3 p-4">
        <SkeletonBlock className="h-4 w-2/3" />
        <SkeletonBlock className="h-3 w-full" />
        <SkeletonBlock className="h-3 w-4/5" />
        <div className="flex items-center justify-between pt-2">
          <SkeletonBlock className="h-4 w-1/3" />
          <SkeletonBlock className="h-8 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export default function SkeletonLoader({
  variant = 'menu',
  count = 3,
  className = '',
}) {
  const isTable = variant === 'table';
  const isStrip = variant === 'menu-strip';
  return (
    <div
      className={`${isTable ? 'overflow-hidden rounded-xl border border-slate-200 bg-white' : isStrip ? 'flex min-w-full gap-4' : 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'} ${className}`}
      role="status"
      aria-label="Memuat data"
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className={isStrip ? 'min-w-[220px] flex-1 sm:min-w-[250px]' : ''}>
          <SkeletonCard variant={isStrip ? 'menu' : variant} />
        </div>
      ))}
    </div>
  );
}
