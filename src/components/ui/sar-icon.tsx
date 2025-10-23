import * as React from "react"
import { cn } from "@/lib/utils"

export const SarIcon = React.forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>(({ className, ...props }, ref) => (
    <svg
      ref={ref}
      className={cn("w-6 h-6", className)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
        <text x="5" y="18" fontSize="16" fontFamily="Arial, sans-serif" fill="currentColor">SAR</text>
    </svg>
));
SarIcon.displayName = "SarIcon";
