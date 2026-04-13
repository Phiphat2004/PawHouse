import * as React from "react"

const Badge = React.forwardRef(({ className, variant = "default", ...props }, ref) => {
    const baseStyles = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2"

    const variants = {
        default: "border-transparent bg-[#846551] text-white hover:bg-[#6d5443]",
        secondary: "border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200",
        destructive: "border-transparent bg-red-500 text-white hover:bg-red-600",
        outline: "text-gray-700 border-gray-300",
        success: "border-transparent bg-green-500 text-white hover:bg-green-600",
        warning: "border-transparent bg-yellow-500 text-white hover:bg-yellow-600",
    }

    return (
        <div
            ref={ref}
            className={`${baseStyles} ${variants[variant]} ${className || ''}`}
            {...props}
        />
    )
})
Badge.displayName = "Badge"

export { Badge }
