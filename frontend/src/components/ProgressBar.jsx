export default function ProgressBar({ value = 0, showLabel = true, size = 'md', color }) {
  const heights = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };
  const getColor = (v) => {
    if (color) return color;
    if (v >= 80) return 'bg-green-500';
    if (v >= 50) return 'bg-blue-500';
    if (v >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };
  return (
    <div className="flex items-center gap-2">
      <div className={`flex-1 bg-gray-200 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`${heights[size]} rounded-full transition-all duration-500 ${getColor(value)}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      {showLabel && <span className="text-xs font-medium text-gray-600 w-8 text-right">{value}%</span>}
    </div>
  );
}
