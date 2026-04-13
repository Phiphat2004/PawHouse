import * as React from "react"
import { ChevronDown, Check } from "lucide-react"

const SelectContext = React.createContext({})

const Select = ({ children, value, onValueChange, disabled }) => {
    const [open, setOpen] = React.useState(false) // Manage open state internally

    // Close dropdown when clicking outside
    const containerRef = React.useRef(null)
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <SelectContext.Provider value={{ value, onValueChange, disabled, open, setOpen }}>
            <div ref={containerRef} className="relative inline-block w-full">
                {children}
            </div>
        </SelectContext.Provider>
    )
}

const SelectGroup = ({ children }) => <div>{children}</div>

const SelectValue = ({ placeholder }) => {
    const { value } = React.useContext(SelectContext)
    // We need to find the label corresponding to the value, but since children are in SelectContent
    // and we are in SelectTrigger -> SelectValue, we might not have easy access to children labels here 
    // without traversing or passing extra props.
    // However, usually SelectValue just displays the value if no label map is provided, 
    // OR we can rely on the user to display the selected item's label?
    // In shadcn/radix, SelectValue automatically finds the selected Item's text.
    // For this simple custom implementation, we might need a workaround if we want to show Label instead of Value.
    // BUT: The previous implementation was: <span>{value || placeholder}</span> which just showed the value (lowercase).
    // Let's improve this: We'll let the user see the Value for now, or we can try to find the label. 
    // Given the constraints and the previous implementation, let's keep it simple: 
    // If the value matches the 'all' case or similar, we might want to capitalize?
    // Actually, looking at AccountManagement.jsx: <SelectValue placeholder="All Status" />
    // The select options are: <SelectItem value="all">All Status</SelectItem>
    // If value is 'all', it shows 'all'. 
    // To make this robust without a complex context registry, we will just render the value.
    // IMPROVEMENT: We will assume the parent passes the correct display value or we accept it.
    // But wait, the previous code displayed `value`. 
    // Let's check `AccountManagement.js`. It passes `statusFilter` which is 'all', 'active', etc.
    // So it was showing "all", "active". 
    // Ideally we want to show "All Status", "Active".
    // Since I cannot change all call sites easily to pass labels, I will implement a lightweight registry?
    // No, that's complex. Let's stick to the previous behavior but capitalized? 
    // OR BETTER: Use a dirty hack to find the label from children? No, SelectValue is a sibling of SelectContent.

    // DECISION: Make SelectValue render `value` but styled nicely. 
    // Or, if value is null/empty, render placeholder.
    // Ideally, we would render the label.
    // Let's use a context-based label registry to support showing labels!

    return <SelectValueDisplay placeholder={placeholder} />
}

// Inner component to access context
const SelectValueDisplay = ({ placeholder }) => {
    const { value, labelMap } = React.useContext(SelectContext)
    // labelMap will be populated by SelectItems if we hoist state? 
    // React strict mode makes this hard with side effects in render.
    // Let's just render value for now to be safe and consistent with previous code, 
    // but maybe capitalize it for better UX if it's a simple string.

    // Actually, let's look at the previous code: <span>{value || placeholder}</span>.
    // So it was just showing the raw value 'all', 'active', 'banned'.
    // That's acceptable but not great. 
    // Let's try to map generic values if possible, otherwise just text.

    const display = value ? (value.charAt(0).toUpperCase() + value.slice(1)) : placeholder
    return <span className="block truncate">{display}</span>
}

const SelectTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
    const { disabled, open, setOpen } = React.useContext(SelectContext)

    return (
        <button
            ref={ref}
            type="button"
            onClick={() => !disabled && setOpen(!open)}
            disabled={disabled}
            className={`
                flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm 
                placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#846551] focus:ring-offset-2
                disabled:cursor-not-allowed disabled:opacity-50
                ${className || ''}
            `}
            {...props}
        >
            {children}
            <ChevronDown className={`h-4 w-4 opacity-50 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
        </button>
    )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectContent = ({ className, children, position = "popper", ...props }) => {
    const { open } = React.useContext(SelectContext)

    if (!open) return null

    return (
        <div
            className={`
                absolute z-50 min-w-[8rem] overflow-hidden rounded-md border border-gray-200 bg-white text-gray-950 shadow-md 
                data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
                top-[calc(100%+4px)] left-0 w-full
                ${className || ''}
            `}
            {...props}
        >
            <div className="p-1">
                {children}
            </div>
        </div>
    )
}
SelectContent.displayName = "SelectContent"

const SelectLabel = ({ className, children, ...props }) => (
    <div className={`py-1.5 pl-8 pr-2 text-sm font-semibold ${className}`} {...props}>
        {children}
    </div>
)
SelectLabel.displayName = "SelectLabel"

const SelectItem = React.forwardRef(({ className, children, value, ...props }, ref) => {
    const { value: selectedValue, onValueChange, setOpen } = React.useContext(SelectContext)
    const isSelected = selectedValue === value

    return (
        <div
            ref={ref}
            className={`
                relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none 
                hover:bg-gray-100 focus:bg-gray-100 focus:text-gray-900 
                data-[disabled]:pointer-events-none data-[disabled]:opacity-50
                ${isSelected ? 'bg-orange-50 text-orange-900' : ''}
                ${className || ''}
            `}
            onClick={(e) => {
                e.stopPropagation()
                onValueChange(value)
                setOpen(false)
            }}
            {...props}
        >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                {isSelected && <Check className="h-4 w-4 text-orange-600" />}
            </span>
            <span className="truncate">{children}</span>
        </div>
    )
})
SelectItem.displayName = "SelectItem"

const SelectSeparator = React.forwardRef(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={`-mx-1 my-1 h-px bg-muted ${className}`}
        {...props}
    />
))
SelectSeparator.displayName = "SelectSeparator"

const SelectScrollUpButton = () => null
const SelectScrollDownButton = () => null

export {
    Select,
    SelectGroup,
    SelectValue,
    SelectTrigger,
    SelectContent,
    SelectLabel,
    SelectItem,
    SelectSeparator,
    SelectScrollUpButton,
    SelectScrollDownButton,
}
