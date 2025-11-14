import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { buttonVariants } from "./button-variants.ts";
import type { ButtonVariantProps } from "./button-variants.ts";
import { cn } from "../../utils/utils";

const Button = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & ButtonVariantProps & { asChild?: boolean }
>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      ref={ref}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
});

Button.displayName = "Button";

export { Button };


