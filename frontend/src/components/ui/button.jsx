import * as React from "react"

const Button = React.forwardRef(({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

    const variants = {
        default: "bg-[#846551] text-white hover:bg-[#6d5443] focus-visible:ring-[#846551]",
        destructive: "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500",
        outline: "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus-visible:ring-gray-400",
        secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-400",
        ghost: "hover:bg-gray-100 text-gray-700",
        link: "text-[#846551] underline-offset-4 hover:underline",
    }

    const sizes = {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
    }

    return (
        <button
            className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className || ''}`}
            ref={ref}
            {...props}
        />
    )
})
Button.displayName = "Button"

export { Button }
