import type {ComponentProps} from 'react';

export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
export type ButtonSize = 'default' | 'sm' | 'icon' | 'icon-circle';
type ButtonProps = ComponentProps<'button'> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
};

export function Button({variant = 'default', size = 'default', loading = false, disabled, type = 'button', className = '', children, ...props}: ButtonProps) {
  return <button {...props} type={type} className={`ui-button ${className}`} data-slot="button" data-variant={variant} data-size={size} data-loading={loading || undefined} aria-busy={loading || props['aria-busy']} disabled={disabled || loading}>
    {loading && <img className="ui-spinner" src="/design-system/spinner.svg" width={16} height={16} alt="" aria-hidden="true"/>}
    {children}
  </button>;
}
