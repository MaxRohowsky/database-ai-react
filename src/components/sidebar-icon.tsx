import { SidebarGroupLabel } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface SidebarLabelProps {
  icon: LucideIcon;
  label: string;
  variant?: "amber" | "blue" | "green" | "purple" | "red" | "gray" | "custom";
  customColors?: {
    border: string;
    background: string;
    icon: string;
    iconFill: string;
  };
  className?: string;
}

const variantStyles = {
  amber: {
    border: "border-amber-100",
    background: "bg-amber-50",
    icon: "text-amber-400",
    iconFill: "fill-amber-400",
  },
  blue: {
    border: "border-blue-100",
    background: "bg-blue-50",
    icon: "text-blue-500",
    iconFill: "none",
  },
  green: {
    border: "border-green-100",
    background: "bg-green-50",
    icon: "text-green-500",
    iconFill: "fill-green-500",
  },
  purple: {
    border: "border-purple-100",
    background: "bg-purple-50",
    icon: "text-purple-500",
    iconFill: "fill-purple-500",
  },
  red: {
    border: "border-red-100",
    background: "bg-red-50",
    icon: "text-red-500",
    iconFill: "fill-red-500",
  },
  gray: {
    border: "border-gray-200",
    background: "bg-gray-50",
    icon: "text-gray-500",
    iconFill: "fill-gray-500",
  },
};

export function SidebarGroupLabelWithIcon({
  icon: Icon,
  label,
  variant = "blue",
  customColors,
  className,
}: SidebarLabelProps) {
  const colors = variant === "custom" ? customColors : variantStyles[variant];

  return (
    <SidebarGroupLabel className={cn("text-black", className)}>
      <div
        className={cn(
          "mr-2 flex h-8 w-8 items-center justify-center rounded-lg shadow-sm",
          colors?.border,
          colors?.background,
        )}
      >
        <Icon className={cn("h-4 w-4", colors?.icon, colors?.iconFill)} />
      </div>
      <span className="text-base font-medium">{label}</span>
    </SidebarGroupLabel>
  );
}
