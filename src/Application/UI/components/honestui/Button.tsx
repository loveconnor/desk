import React from "react";
import "./button.css";

// Adapted from HonestUI's MIT-licensed button registry:
// https://www.honestui.com/r/button.json
// The native rendering and CSS port keeps this React 17 app free of a second styling runtime.
type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm";
  asChild?: boolean;
};
export function Button({
  variant = "default",
  size = "default",
  asChild = false,
  className = "",
  children,
  ...props
}: ButtonProps) {
  const shared = {
    "data-slot": "button",
    "data-variant": variant,
    "data-size": size,
    className: `hui-button ${className}`,
  };
  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement<{
      className?: string;
    }>;
    return React.cloneElement(child, {
      ...props,
      ...shared,
      className: `${shared.className} ${child.props.className || ""}`,
    });
  }
  return (
    <button type="button" {...props} {...shared}>
      {children}
    </button>
  );
}
