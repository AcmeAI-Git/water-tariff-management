import { motion } from "motion/react";

export type MetricStatsVariant = "blue" | "green" | "purple" | "gray";

const variantClasses: Record<MetricStatsVariant, string> = {
  blue: "border-gray-200 hover:border-blue-300 hover:shadow-md",
  green: "border-gray-200 hover:border-green-300 hover:shadow-md",
  purple: "border-gray-200 hover:border-purple-300 hover:shadow-md",
  gray: "border-gray-200 hover:border-gray-300 hover:shadow-md",
};

export interface MetricStatsCardItem {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
}

export interface MetricStatsCardProps {
  title: string;
  items: MetricStatsCardItem[];
  variant?: MetricStatsVariant;
  animationDelay?: number;
}

export function MetricStatsCard({
  title,
  items,
  variant = "gray",
  animationDelay = 0,
}: MetricStatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: animationDelay }}
      className={`bg-white border-2 rounded-xl p-6 md:p-8 transition-all duration-300 ${variantClasses[variant]}`}
    >
      <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-6 text-center">
        {title}
      </h3>
      <div className="space-y-5">
        {items.map((item, index) => (
          <div
            key={index}
            className={`text-center ${index < items.length - 1 ? "pb-4 border-b border-gray-200" : ""}`}
          >
            <div className="text-xs text-gray-500 mb-1">{item.label}</div>
            <div
              className={`text-2xl md:text-3xl font-bold text-gray-900 ${item.valueClassName ?? ""}`}
            >
              {item.value}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
