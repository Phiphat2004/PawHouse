import * as React from "react"

const AlertDialog = ({ children, open, onOpenChange }) => {
    return (
        <>
            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div
                        className="fixed inset-0 bg-black/50"
                        onClick={() => onOpenChange?.(false)}
                    />
                    {children}
                </div>
            )}
        </>
    )
}

const AlertDialogContent = React.forwardRef(({ className, children, ...props }, ref) => {
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
AlertDialogContent.displayName = "AlertDialogContent"

const AlertDialogHeader = ({ className, ...props }) => (
    <div
        className={`flex flex-col space-y-2 text-center sm:text-left ${className || ''}`}
        {...props}
    />
)
AlertDialogHeader.displayName = "AlertDialogHeader"

const AlertDialogFooter = ({ className, ...props }) => (
    <div
        className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 mt-4 ${className || ''}`}
        {...props}
    />
)
AlertDialogFooter.displayName = "AlertDialogFooter"

const AlertDialogTitle = React.forwardRef(({ className, ...props }, ref) => (
    <h2
        ref={ref}
        className={`text-lg font-semibold ${className || ''}`}
        {...props}
    />
))
AlertDialogTitle.displayName = "AlertDialogTitle"

const AlertDialogDescription = React.forwardRef(({ className, ...props }, ref) => (
    <p
        ref={ref}
        className={`text-sm text-gray-500 ${className || ''}`}
        {...props}
    />
))
AlertDialogDescription.displayName = "AlertDialogDescription"

const AlertDialogAction = React.forwardRef(({ className, ...props }, ref) => (
    <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-[#846551] text-white hover:bg-[#6d5443] h-10 px-4 py-2 ${className || ''}`}
        {...props}
    />
))
AlertDialogAction.displayName = "AlertDialogAction"

const AlertDialogCancel = React.forwardRef(({ className, ...props }, ref) => (
    <button
        ref={ref}
        className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 bg-white hover:bg-gray-50 h-10 px-4 py-2 mt-2 sm:mt-0 ${className || ''}`}
        {...props}
    />
))
AlertDialogCancel.displayName = "AlertDialogCancel"

export {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
}
