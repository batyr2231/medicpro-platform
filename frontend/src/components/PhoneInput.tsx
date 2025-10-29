'use client';

import React from 'react';
import InputMask from 'react-input-mask';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export default function PhoneInput({
  value,
  onChange,
  placeholder = "+7 (___) ___-__-__",
  required = false,
  className = "",
  disabled = false
}: PhoneInputProps) {
  return (
    <InputMask
      mask="+7 (999) 999-99-99"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      maskChar="_"
    >
      {(inputProps: any) => (
        <input
          {...inputProps}
          type="tel"
          required={required}
          className={className}
        />
      )}
    </InputMask>
  );
}