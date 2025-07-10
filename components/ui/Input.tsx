/**
 * مكون الإدخال الشامل
 * Comprehensive Input Component
 * @version 1.0.0
 * @author Sabq AI Team
 */

import React, { forwardRef, useState, useEffect } from 'react';
import { analyticsManager, EventType } from '../../lib/analytics';
import { privacyManager, PersonalDataType, ProcessingPurpose } from '../../lib/privacy-controls';

// أنواع الإدخال
export type InputType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number' 
  | 'tel' 
  | 'url' 
  | 'search'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'outline' | 'filled' | 'underline';
export type InputStatus = 'default' | 'error' | 'warning' | 'success';

export interface InputOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface InputProps {
  // خصائص أساسية
  type?: InputType;
  name?: string;
  id?: string;
  value?: string | number | boolean;
  defaultValue?: string | number | boolean;
  placeholder?: string;
  
  // التصميم
  size?: InputSize;
  variant?: InputVariant;
  status?: InputStatus;
  fullWidth?: boolean;
  className?: string;
  
  // السلوك
  disabled?: boolean;
  readonly?: boolean;
  required?: boolean;
  autoFocus?: boolean;
  autoComplete?: string;
  
  // التحقق والتحكم
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  pattern?: string;
  
  // التسميات والرسائل
  label?: string;
  description?: string;
  errorMessage?: string;
  successMessage?: string;
  warningMessage?: string;
  
  // خيارات للـ select
  options?: InputOption[];
  multiple?: boolean;
  
  // النصوص للـ textarea
  rows?: number;
  cols?: number;
  resize?: 'none' | 'both' | 'horizontal' | 'vertical';
  
  // الخصوصية
  sensitive?: boolean;
  trackInput?: boolean;
  
  // الأحداث
  onChange?: (value: any, event: React.ChangeEvent<any>) => void;
  onBlur?: (event: React.FocusEvent<any>) => void;
  onFocus?: (event: React.FocusEvent<any>) => void;
  onKeyDown?: (event: React.KeyboardEvent<any>) => void;
  onKeyUp?: (event: React.KeyboardEvent<any>) => void;
  onSubmit?: () => void;
}

// مكون الإدخال الرئيسي
export const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, InputProps>(
  ({
    type = 'text',
    name,
    id,
    value,
    defaultValue,
    placeholder,
    size = 'md',
    variant = 'default',
    status = 'default',
    fullWidth = false,
    className = '',
    disabled = false,
    readonly = false,
    required = false,
    autoFocus = false,
    autoComplete,
    minLength,
    maxLength,
    min,
    max,
    step,
    pattern,
    label,
    description,
    errorMessage,
    successMessage,
    warningMessage,
    options = [],
    multiple = false,
    rows = 4,
    cols,
    resize = 'vertical',
    sensitive = false,
    trackInput = true,
    onChange,
    onBlur,
    onFocus,
    onKeyDown,
    onKeyUp,
    onSubmit,
    ...props
  }, ref) => {
    const [internalValue, setInternalValue] = useState(value || defaultValue || '');
    const [isFocused, setIsFocused] = useState(false);
    const [hasInteracted, setHasInteracted] = useState(false);

    // تحديث القيمة الداخلية عند تغيير القيمة الخارجية
    useEffect(() => {
      if (value !== undefined) {
        setInternalValue(value);
      }
    }, [value]);

    // فئات CSS
    const inputClasses = [
      'sabq-input',
      `sabq-input--${variant}`,
      `sabq-input--${size}`,
      `sabq-input--${status}`,
      fullWidth ? 'sabq-input--full-width' : '',
      disabled ? 'sabq-input--disabled' : '',
      readonly ? 'sabq-input--readonly' : '',
      isFocused ? 'sabq-input--focused' : '',
      className
    ].filter(Boolean).join(' ');

    const containerClasses = [
      'sabq-input-container',
      fullWidth ? 'sabq-input-container--full-width' : ''
    ].filter(Boolean).join(' ');

    // معالج التغيير
    const handleChange = async (event: React.ChangeEvent<any>) => {
      const newValue = type === 'checkbox' ? event.target.checked : event.target.value;
      
      if (value === undefined) {
        setInternalValue(newValue);
      }
      
      setHasInteracted(true);
      
      // تتبع الإدخال
      if (trackInput && !sensitive) {
        await analyticsManager.trackEvent({
          type: EventType.USER_ACTION,
          category: 'form',
          action: 'input_change',
          label: name || id || 'unknown_input'
        });
      }

      // تسجيل في نظام الخصوصية للبيانات الحساسة
      if (sensitive) {
        await privacyManager.logDataProcessing({
          id: Date.now().toString(),
          userId: 'current_user', // في تطبيق حقيقي، سيُحصل عليه من السياق
          action: 'input',
          dataType: PersonalDataType.SENSITIVE,
          purpose: ProcessingPurpose.USER_MANAGEMENT,
          timestamp: new Date(),
          justification: `User input in field: ${name || id || 'unknown'}`
        });
      }
      
      onChange?.(newValue, event);
    };

    // معالج التركيز
    const handleFocus = (event: React.FocusEvent<any>) => {
      setIsFocused(true);
      onFocus?.(event);
    };

    // معالج فقدان التركيز
    const handleBlur = (event: React.FocusEvent<any>) => {
      setIsFocused(false);
      onBlur?.(event);
    };

    // معالج الضغط على المفاتيح
    const handleKeyDown = (event: React.KeyboardEvent<any>) => {
      if (event.key === 'Enter' && type !== 'textarea') {
        onSubmit?.();
      }
      onKeyDown?.(event);
    };

    // رسالة الحالة
    const statusMessage = 
      status === 'error' ? errorMessage :
      status === 'warning' ? warningMessage :
      status === 'success' ? successMessage :
      null;

    // خصائص مشتركة
    const commonProps = {
      id: id || name,
      name,
      value: internalValue,
      placeholder,
      disabled,
      readOnly: readonly,
      required,
      autoFocus,
      autoComplete,
      className: inputClasses,
      onChange: handleChange,
      onFocus: handleFocus,
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      onKeyUp,
      'aria-label': label,
      'aria-describedby': description ? `${id || name}-description` : undefined,
      'aria-invalid': status === 'error',
      ...props
    };

    // تحديد المكون المناسب
    const renderInput = () => {
      switch (type) {
        case 'textarea':
          return (
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              rows={rows}
              cols={cols}
              style={{ resize }}
              {...commonProps}
            />
          );

        case 'select':
          return (
            <select
              ref={ref as React.Ref<HTMLSelectElement>}
              multiple={multiple}
              {...commonProps}
            >
              {placeholder && (
                <option value="" disabled>
                  {placeholder}
                </option>
              )}
              {options.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
            </select>
          );

        case 'checkbox':
          return (
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              type="checkbox"
              checked={!!internalValue}
              {...commonProps}
            />
          );

        case 'radio':
          return (
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              type="radio"
              checked={!!internalValue}
              {...commonProps}
            />
          );

        default:
          return (
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              type={type}
              minLength={minLength}
              maxLength={maxLength}
              min={min}
              max={max}
              step={step}
              pattern={pattern}
              {...commonProps}
            />
          );
      }
    };

    return (
      <div className={containerClasses}>
        {label && (
          <label
            htmlFor={id || name}
            className={`sabq-input-label ${required ? 'sabq-input-label--required' : ''}`}
          >
            {label}
            {required && <span className="sabq-input-required">*</span>}
          </label>
        )}
        
        {description && (
          <div
            id={`${id || name}-description`}
            className="sabq-input-description"
          >
            {description}
          </div>
        )}
        
        <div className="sabq-input-wrapper">
          {renderInput()}
        </div>
        
        {statusMessage && (
          <div className={`sabq-input-message sabq-input-message--${status}`}>
            {statusMessage}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// مكونات مخصصة للأنواع المحددة
export const TextInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>((props, ref) => (
  <Input {...props} type="text" ref={ref} />
));

export const EmailInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>((props, ref) => (
  <Input {...props} type="email" ref={ref} />
));

export const PasswordInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>((props, ref) => (
  <Input {...props} type="password" sensitive={true} ref={ref} />
));

export const NumberInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>((props, ref) => (
  <Input {...props} type="number" ref={ref} />
));

export const SearchInput = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>((props, ref) => (
  <Input {...props} type="search" ref={ref} />
));

export const TextArea = forwardRef<HTMLTextAreaElement, Omit<InputProps, 'type'>>((props, ref) => (
  <Input {...props} type="textarea" ref={ref} />
));

export const Select = forwardRef<HTMLSelectElement, Omit<InputProps, 'type'>>((props, ref) => (
  <Input {...props} type="select" ref={ref} />
));

export const Checkbox = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>((props, ref) => (
  <Input {...props} type="checkbox" ref={ref} />
));

export const RadioButton = forwardRef<HTMLInputElement, Omit<InputProps, 'type'>>((props, ref) => (
  <Input {...props} type="radio" ref={ref} />
));

// خطاف للتحقق من الصحة
export const useInputValidation = (
  value: any,
  rules: ValidationRule[]
): { isValid: boolean; errors: string[] } => {
  const [isValid, setIsValid] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const validationErrors: string[] = [];

    rules.forEach(rule => {
      if (!rule.validator(value)) {
        validationErrors.push(rule.message);
      }
    });

    setErrors(validationErrors);
    setIsValid(validationErrors.length === 0);
  }, [value, rules]);

  return { isValid, errors };
};

export interface ValidationRule {
  validator: (value: any) => boolean;
  message: string;
}

// قواعد التحقق الجاهزة
export const ValidationRules = {
  required: (message = 'هذا الحقل مطلوب'): ValidationRule => ({
    validator: (value) => value !== null && value !== undefined && value !== '',
    message
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validator: (value) => !value || value.toString().length >= min,
    message: message || `يجب أن يكون ${min} أحرف على الأقل`
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validator: (value) => !value || value.toString().length <= max,
    message: message || `يجب أن يكون ${max} أحرف على الأكثر`
  }),

  email: (message = 'البريد الإلكتروني غير صحيح'): ValidationRule => ({
    validator: (value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message
  }),

  url: (message = 'الرابط غير صحيح'): ValidationRule => ({
    validator: (value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message
  }),

  number: (message = 'يجب أن يكون رقماً'): ValidationRule => ({
    validator: (value) => !value || !isNaN(Number(value)),
    message
  }),

  minValue: (min: number, message?: string): ValidationRule => ({
    validator: (value) => !value || Number(value) >= min,
    message: message || `يجب أن يكون ${min} على الأقل`
  }),

  maxValue: (max: number, message?: string): ValidationRule => ({
    validator: (value) => !value || Number(value) <= max,
    message: message || `يجب أن يكون ${max} على الأكثر`
  }),

  pattern: (regex: RegExp, message = 'الصيغة غير صحيحة'): ValidationRule => ({
    validator: (value) => !value || regex.test(value),
    message
  }),

  sameAs: (otherValue: any, message = 'القيم غير متطابقة'): ValidationRule => ({
    validator: (value) => value === otherValue,
    message
  })
};

// أنماط CSS أساسية (ستُضاف إلى ملف CSS منفصل)
export const InputStyles = `
.sabq-input-container {
  margin-bottom: 1rem;
}

.sabq-input-container--full-width {
  width: 100%;
}

.sabq-input-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.sabq-input-label--required {
  position: relative;
}

.sabq-input-required {
  color: #ef4444;
  margin-left: 0.25rem;
}

.sabq-input-description {
  margin-bottom: 0.5rem;
  color: #6b7280;
  font-size: 0.75rem;
}

.sabq-input {
  width: 100%;
  border-radius: 0.375rem;
  border: 1px solid #d1d5db;
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
  transition: all 0.2s;
  background-color: white;
}

.sabq-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.sabq-input--sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.sabq-input--lg {
  padding: 0.75rem 1rem;
  font-size: 1rem;
}

.sabq-input--error {
  border-color: #ef4444;
}

.sabq-input--error:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.sabq-input--success {
  border-color: #10b981;
}

.sabq-input--warning {
  border-color: #f59e0b;
}

.sabq-input--disabled {
  background-color: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.sabq-input-message {
  margin-top: 0.25rem;
  font-size: 0.75rem;
}

.sabq-input-message--error {
  color: #ef4444;
}

.sabq-input-message--warning {
  color: #f59e0b;
}

.sabq-input-message--success {
  color: #10b981;
}
`; 