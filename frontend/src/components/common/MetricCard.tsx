import { motion } from "motion/react";

export type MetricCardVariant = "blue" | "green" | "purple" | "orange" | "cyan";

const variantClasses: Record<MetricCardVariant, string> = {
  blue: "border-blue-200 hover:border-blue-400 hover:shadow-md",
  green: "border-green-200 hover:border-green-400 hover:shadow-md",
  purple: "border-purple-200 hover:border-purple-400 hover:shadow-md",
  orange: "border-orange-200 hover:border-orange-400 hover:shadow-md",
  cyan: "border-cyan-200 hover:border-cyan-400 hover:shadow-md",
};

export interface MetricCardProps {
  label: string;
  value: React.ReactNode;
  subtitle?: string;
  variant?: MetricCardVariant;
  animationDelay?: number;
}

export function MetricCard({
  label,
  value,
  subtitle,
  variant = "blue",
  animationDelay = 0,
}: MetricCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: animationDelay }}
      className={`bg-white border-2 rounded-xl p-6 transition-all duration-300 ${variantClasses[variant]}`}
    >
      <div className="text-center">
        <div className="text-xs text-gray-600 mb-2 font-medium">{label}</div>
        <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
          {value}
        </div>
        {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
      </div>
    </motion.div>
  );
}
