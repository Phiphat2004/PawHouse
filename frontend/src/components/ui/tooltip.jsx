import * as React from "react"

// Simple tooltip implementation without external dependencies
const TooltipContext = React.createContext({})

const TooltipProvider = ({ children, delayDuration = 200 }) => {
    return (
        <TooltipContext.Provider value={{ delayDuration }}>
            {children}
        </TooltipContext.Provider>
    )
}

const Tooltip = ({ children }) => {
    const [open, setOpen] = React.useState(false)

    return (
        <TooltipContext.Provider value={{ open, setOpen }}>
            <div className="relative inline-block">
                {children}
            </div>
        </TooltipContext.Provider>
    )
}

const TooltipTrigger = React.forwardRef(({ className, children, asChild, ...props }, ref) => {
    const { setOpen } = React.useContext(TooltipContext)

    return (
        <div
            ref={ref}
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            className={className}
            {...props}
        >
            {children}
        </div>
    )
})
TooltipTrigger.displayName = "TooltipTrigger"

const TooltipContent = React.forwardRef(({ className, sideOffset = 4, children, ...props }, ref) => {
    const { open } = React.useContext(TooltipContext)

    if (!open) return null

    return (
        <div
            ref={ref}
            className={`absolute z-50 overflow-hidden rounded-md border bg-gray-900 px-3 py-1.5 text-xs text-white shadow-md animate-in fade-in-0 zoom-in-95 ${className || ''}`}
            style={{
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginBottom: `${sideOffset}px`,
            }}
            {...props}
        >
            {children}
            <div
                className="absolute border-4 border-transparent border-t-gray-900"
                style={{
                    top: '100%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                }}
            />
        </div>
    )
})
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
