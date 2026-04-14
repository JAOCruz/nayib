import type { Stat } from '../../config';

interface StatBoxProps {
  stat: Stat;
  delay?: number;
}

export function StatBox({ stat, delay = 0 }: StatBoxProps) {
  return (
    <div
      className="group glass-white rounded-xl p-6 md:p-8 text-center hover-lift"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Icon */}
      <div className="mb-4 flex justify-center">
        <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
          <img
            src={stat.icon}
            alt={stat.label}
            className="w-10 h-10 md:w-12 md:h-12 object-contain"
          />
        </div>
      </div>

      {/* Value */}
      <h3 className="text-4xl md:text-5xl font-bold text-primary mb-2 group-hover:scale-110 transition-transform">
        {stat.value}
      </h3>

      {/* Label */}
      <p className="text-base md:text-lg font-medium text-gray-700">
        {stat.label}
      </p>

      {/* Description */}
      {stat.description && (
        <p className="text-sm text-gray-500 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
          {stat.description}
        </p>
      )}
    </div>
  );
}
