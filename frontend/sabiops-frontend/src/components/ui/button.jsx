import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-green-600 text-white shadow-sm hover:bg-green-700 active:bg-green-800 focus-visible:ring-green-500/20",
        primary:
          "bg-green-600 text-white shadow-sm hover:bg-green-700 active:bg-green-800 focus-visible:ring-green-500/20",
        destructive:
          "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-500/20",
        outline:
          "border border-green-200 bg-white text-green-700 shadow-sm hover:bg-green-50 active:bg-green-100 focus-visible:ring-green-500/20",
        secondary:
          "bg-gray-100 text-gray-900 shadow-sm hover:bg-gray-200 active:bg-gray-300 focus-visible:ring-gray-500/20",
        ghost:
          "text-green-700 hover:bg-green-50 active:bg-green-100 focus-visible:ring-green-500/20",
        link: 
          "text-green-600 underline-offset-4 hover:underline hover:text-green-700 active:text-green-800",
        success:
          "bg-green-600 text-white shadow-sm hover:bg-green-700 active:bg-green-800 focus-visible:ring-green-500/20",
        warning:
          "bg-yellow-500 text-white shadow-sm hover:bg-yellow-600 active:bg-yellow-700 focus-visible:ring-yellow-500/20",
      },
      size: {
        default: "h-9 sm:h-10 px-3 sm:px-4 py-1.5 sm:py-2 has-[>svg]:px-2.5 sm:has-[>svg]:px-3 text-sm sm:text-base",
        sm: "h-7 sm:h-8 rounded-md gap-1.5 px-2.5 sm:px-3 text-xs sm:text-sm has-[>svg]:px-2 sm:has-[>svg]:px-2.5",
        lg: "h-10 sm:h-12 rounded-md px-4 sm:px-6 text-base sm:text-lg has-[>svg]:px-3 sm:has-[>svg]:px-4",
        xl: "h-12 sm:h-14 rounded-lg px-6 sm:px-8 text-lg sm:text-xl has-[>svg]:px-4 sm:has-[>svg]:px-6",
        icon: "size-9 sm:size-10",
        "icon-sm": "size-7 sm:size-8",
        "icon-lg": "size-11 sm:size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

const Button = React.forwardRef(({
  className,
  variant,
  size,
  asChild = false,
  ...props
}, ref) => {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props} />
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
