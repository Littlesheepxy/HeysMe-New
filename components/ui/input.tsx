import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  variant?: "default" | "brand" | "brand-outline" | "brand-glass"
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant = "default", ...props }, ref) => {
    const variants = {
      default: "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-300",
      brand: "flex h-10 w-full rounded-md border border-emerald-200 bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-emerald-400 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:shadow-brand hover:border-emerald-300 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-300",
      "brand-outline": "flex h-10 w-full rounded-lg border-2 border-brand-primary/30 bg-transparent px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-brand-primary/60 focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 focus:shadow-brand-glow hover:border-brand-primary/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-300",
      "brand-glass": "flex h-10 w-full rounded-lg glass-brand px-3 py-2 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-brand-primary/60 focus:ring-2 focus:ring-brand-primary/30 focus:shadow-brand hover:bg-brand-primary/10 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm transition-all duration-300"
    }

    return (
      <input
        type={type}
        className={cn(
          variants[variant],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
