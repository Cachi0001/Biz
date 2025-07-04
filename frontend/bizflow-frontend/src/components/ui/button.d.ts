import * as React from "react";
import { VariantProps } from "class-variance-authority";

declare const buttonVariants: any;

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button: React.ForwardRefExoticComponent<
  ButtonProps & React.RefAttributes<HTMLButtonElement>
>;

export { buttonVariants };