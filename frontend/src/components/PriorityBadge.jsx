const config = {
  low: 'bg-gray-100 text-gray-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700'
};

export default function PriorityBadge({ priority }) {
  return (
    <span className={`badge ${config[priority] || config.medium}`}>
      {priority}
    </span>
  );
}
