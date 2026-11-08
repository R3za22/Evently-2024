import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

type Variant = "primary" | "dark" | "amber" | "outline" | "danger";
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: Variant;
  size?: "md" | "lg";
}

/** Canvas button: 12px radius, 44px min target (52px large). */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = "primary", size = "md", asChild, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp ref={ref} className={cn("btn", `btn-${variant}`, size === "lg" && "btn-lg", className)} {...props} />;
});
Button.displayName = "Button";
export { Button };
