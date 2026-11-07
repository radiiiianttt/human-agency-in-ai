'use client';

import * as SelectPrimitive from '@radix-ui/react-select';

type SelectProps = {
  label: string;
  placeholder: string;
  options: readonly {value: string; label: string}[];
  value?: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
  size?: 'default' | 'sm';
  className?: string;
};

export function Select({label, placeholder, options, value, onValueChange, disabled, size = 'default', className = ''}: SelectProps) {
  return <SelectPrimitive.Root value={value} onValueChange={onValueChange} disabled={disabled}>
    <SelectPrimitive.Trigger className={`ui-select ${className}`} data-slot="select" data-size={size} aria-label={label}>
      <SelectPrimitive.Value placeholder={placeholder}/>
      <SelectPrimitive.Icon asChild><img src="/design-system/chevron-down.svg" width={16} height={16} alt="" aria-hidden="true"/></SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content className="ui-select-content" position="popper" sideOffset={4} collisionPadding={12}>
        <SelectPrimitive.Viewport className="ui-select-viewport">
          {options.map(option => <SelectPrimitive.Item className="ui-select-item" key={option.value} value={option.value}>
            <SelectPrimitive.ItemIndicator className="ui-select-indicator"><img src="/design-system/check.svg" width={16} height={16} alt="" aria-hidden="true"/></SelectPrimitive.ItemIndicator>
            <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
          </SelectPrimitive.Item>)}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  </SelectPrimitive.Root>;
}
