"use client";

import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "../../utils/utils";

interface CalendarProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  mode?: "single" | "range";
  initialFocus?: boolean;
  className?: string;
  disabled?: boolean;
  showOutsideDays?: boolean;
}

export function Calendar({
  selected,
  onSelect,
  className,
  disabled,
}: CalendarProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(selected);
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  React.useEffect(() => {
    setSelectedDate(selected);
  }, [selected]);

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onSelect?.(date);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    // Adjust for Monday as first day (weekStartsOn: 1)
    const adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;

    const days: (Date | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < adjustedStartingDay; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const days = getDaysInMonth(currentMonth);
  const weekDays = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  return (
    <div className={cn("p-3 bg-white", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => navigateMonth("prev")}
          className="p-1 hover:bg-gray-100 rounded-md"
          disabled={disabled}
        >
          <CalendarIcon className="h-4 w-4 rotate-90" />
        </button>
        <div className="text-sm font-medium">
          {format(currentMonth, "MMMM yyyy")}
        </div>
        <button
          type="button"
          onClick={() => navigateMonth("next")}
          className="p-1 hover:bg-gray-100 rounded-md"
          disabled={disabled}
        >
          <CalendarIcon className="h-4 w-4 -rotate-90" />
        </button>
      </div>

      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="w-9 h-9 flex items-center justify-center text-xs font-medium text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="w-9 h-9" />;
          }

          const isDateToday = isToday(date);
          const isDateSelected = isSelected(date);

          return (
            <button
              key={date.toISOString()}
              type="button"
              onClick={() => handleDateSelect(date)}
              disabled={disabled}
              className={cn(
                "w-9 h-9 rounded-md text-sm font-normal transition-colors",
                "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1",
                isDateToday && "bg-blue-50 text-blue-600 font-semibold",
                isDateSelected && "bg-blue-600 text-white hover:bg-blue-700",
                !isDateToday && !isDateSelected && "text-gray-900"
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Export a wrapper component that works with Popover (for backward compatibility)
export function CalendarWithPopover({
  selected,
  onSelect,
  children,
  ...props
}: CalendarProps & { children?: React.ReactNode }) {
  if (children) {
    // If children provided, assume it's being used with Popover
    return (
      <Calendar selected={selected} onSelect={onSelect} {...props} />
    );
  }
  return <Calendar selected={selected} onSelect={onSelect} {...props} />;
}
