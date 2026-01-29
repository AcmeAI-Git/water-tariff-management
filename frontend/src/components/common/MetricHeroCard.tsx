import { motion } from "motion/react";

export type MetricHeroVariant = "blue" | "green";

const variantClasses: Record<MetricHeroVariant, string> = {
  blue: "border-gray-200 hover:border-blue-300 hover:shadow-lg",
  green: "border-gray-200 hover:border-green-300 hover:shadow-lg",
};

export interface MetricHeroCardProps {
  label: string;
  value: React.ReactNode;
  subtitle?: string;
  variant?: MetricHeroVariant;
  animationDelay?: number;
}

export function MetricHeroCard({
  label,
  value,
  subtitle,
  variant = "blue",
  animationDelay = 0,
}: MetricHeroCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: animationDelay }}
      className={`bg-white border-2 rounded-xl p-8 transition-all duration-300 ${variantClasses[variant]}`}
    >
      <div className="text-center">
        <div className="text-sm text-gray-500 uppercase tracking-wide mb-3 font-medium">
          {label}
        </div>
        <div className="text-5xl md:text-6xl font-bold text-gray-900 mb-2">
          {value}
        </div>
        {subtitle && (
          <div className="text-sm text-gray-600">{subtitle}</div>
        )}
      </div>
    </motion.div>
  );
}
