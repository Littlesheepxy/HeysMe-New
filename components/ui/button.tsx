import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        // 品牌主要按钮 - 青绿渐变
        default: "bg-brand-gradient text-white hover:shadow-brand-lg transform hover:scale-[1.02] active:scale-[0.98]",
        // 品牌渐变按钮
        brand: "bg-brand-gradient text-white hover:shadow-brand-lg hover:shadow-brand-glow transform hover:scale-[1.02] active:scale-[0.98] btn-ripple",
        // 深色品牌渐变
        "brand-dark": "bg-brand-gradient-dark text-white hover:shadow-brand-xl transform hover:scale-[1.02] active:scale-[0.98]",
        // 品牌outline按钮
        "brand-outline": "border-2 border-brand-primary text-brand-primary bg-transparent hover:bg-brand-primary hover:text-white hover:shadow-brand transform hover:scale-[1.02]",
        // 品牌ghost按钮
        "brand-ghost": "text-brand-primary hover:bg-brand-primary/10 hover:text-brand-primary transform hover:scale-[1.02]",
        // 品牌次要按钮
        "brand-secondary": "bg-brand-secondary text-white hover:bg-brand-accent hover:shadow-cyan-glow transform hover:scale-[1.02]",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 transform hover:scale-[1.02]",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground transform hover:scale-[1.02]",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 transform hover:scale-[1.02]",
        ghost: "hover:bg-accent hover:text-accent-foreground transform hover:scale-[1.02]",
        link: "text-primary underline-offset-4 hover:underline",
        // 玻璃拟态品牌按钮
        "brand-glass": "glass-brand text-brand-primary hover:bg-brand-primary/20 hover:text-brand-primary transform hover:scale-[1.02]",
        // 发光品牌按钮
        "brand-glow": "bg-brand-gradient text-white hover:shadow-brand-glow animate-brand-pulse transform hover:scale-[1.05]",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  ripple?: boolean
  shimmer?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ripple = false, shimmer = false, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    const buttonClasses = cn(
      buttonVariants({ variant, size }),
      {
        "btn-ripple": ripple || variant === "brand",
        "relative overflow-hidden": shimmer,
      },
      className
    )

    const shimmerElement = shimmer && (
      <div className="absolute inset-0 -translate-x-full animate-brand-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    )

    if (asChild) {
      return (
        <Comp
          className={buttonClasses}
          ref={ref}
          {...props}
        >
          {children}
        </Comp>
      )
    }

    return (
      <Comp
        className={buttonClasses}
        ref={ref}
        {...props}
      >
        {children}
        {shimmerElement}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
