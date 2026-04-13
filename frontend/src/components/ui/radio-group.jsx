import * as React from "react"

const RadioGroupContext = React.createContext({})

const RadioGroup = React.forwardRef(({ className, value, onValueChange, ...props }, ref) => {
    return (
        <RadioGroupContext.Provider value={{ value, onValueChange }}>
            <div ref={ref} className={className} {...props} />
        </RadioGroupContext.Provider>
    )
})
RadioGroup.displayName = "RadioGroup"

const RadioGroupItem = React.forwardRef(({ className, value, ...props }, ref) => {
    const { value: selectedValue, onValueChange } = React.useContext(RadioGroupContext)
    const isChecked = selectedValue === value

    return (
        <button
            ref={ref}
            type="button"
            role="radio"
            aria-checked={isChecked}
            onClick={() => onValueChange?.(value)}
            className={`aspect-square h-4 w-4 rounded-full border border-gray-300 text-[#846551] ring-offset-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#846551] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ''}`}
            {...props}
        >
            {isChecked && (
                <div className="flex items-center justify-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-[#846551]" />
                </div>
            )}
        </button>
    )
})
RadioGroupItem.displayName = "RadioGroupItem"

export { RadioGroup, RadioGroupItem }
