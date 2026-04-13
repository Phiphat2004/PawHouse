import * as React from "react"

const DialogContext = React.createContext({})

const Dialog = ({ children, open, onOpenChange }) => {
    return (
        <DialogContext.Provider value={{ open, onOpenChange }}>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="fixed inset-0 bg-black/50"
                        onClick={() => onOpenChange?.(false)}
                    />
                    {children}
                </div>
            )}
        </DialogContext.Provider>
    )
}

const DialogContent = React.forwardRef(({ className, children, ...props }, ref) => {
    return (
        <div
            ref={ref}
            className={`relative z-50 bg-white rounded-lg shadow-lg p-6 w-full max-w-lg mx-4 animate-in fade-in-0 zoom-in-95 ${className || ''}`}
            onClick={(e) => e.stopPropagation()}
            {...props}
        >
            {children}
        </div>
    )
})
DialogContent.displayName = "DialogContent"

const DialogHeader = ({ className, ...props }) => (
    <div
        className={`flex flex-col space-y-1.5 text-center sm:text-left mb-4 ${className || ''}`}
        {...props}
    />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({ className, ...props }) => (
    <div
        className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4 ${className || ''}`}
        {...props}
    />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef(({ className, ...props }, ref) => (
    <h2
        ref={ref}
        className={`text-lg font-semibold leading-none tracking-tight ${className || ''}`}
        {...props}
    />
))
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={`text-sm text-gray-500 ${className || ''}`}
        {...props}
    />
))
DialogDescription.displayName = "DialogDescription"

export {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
}
