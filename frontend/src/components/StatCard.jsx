export default function StatCard({ title, value, icon: Icon, color = 'blue', subtitle }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950',
    green: 'bg-green-50 text-green-600 dark:bg-green-950',
    yellow: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950',
    red: 'bg-red-50 text-red-600 dark:bg-red-950',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950'
  };
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
