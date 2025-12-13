import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "./dropdown-menu";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils/utils";

export interface DropdownOption {
    value: string;
    label: string;
}

export interface DropdownProps {
    options: DropdownOption[];
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

export function Dropdown({
    options,
    value,
    onChange,
    placeholder = "Select an option",
    className,
    disabled = false,
}: DropdownProps) {
    const selectedOption = options.find((opt) => opt.value === value);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild disabled={disabled}>
                <button
                    className={cn(
                        "flex items-center justify-between text-sm text-gray-600 bg-white border border-gray-300 rounded-lg px-3 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-blue-500 hover:bg-gray-50 transition-colors min-w-[150px]",
                        disabled && "opacity-50 cursor-not-allowed bg-gray-100 hover:bg-gray-100",
                        className
                    )}
                    disabled={disabled}
                >
                    <span className="truncate">
                        {selectedOption ? selectedOption.label : placeholder}
                    </span>
                    <ChevronDown size={16} className="ml-2 text-gray-400" />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align="start"
                className="min-w-[150px] bg-white"
            >
                {options.map((option) => (
                    <DropdownMenuItem
                        key={option.value}
                        onClick={() => onChange?.(option.value)}
                        className={cn(
                            "cursor-pointer",
                            value === option.value && "bg-gray-100"
                        )}
                    >
                        {option.label}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
