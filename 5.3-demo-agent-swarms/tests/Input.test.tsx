import React, { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../src/components/Input';

describe('Input Component', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
  };

  it('renders with label', () => {
    render(<Input {...defaultProps} label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('renders input element', () => {
    render(<Input {...defaultProps} type="email" placeholder="Enter email" />);
    const input = screen.getByPlaceholderText('Enter email') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.type).toBe('email');
  });

  it('updates value on change', () => {
    const onChange = jest.fn();
    render(<Input {...defaultProps} value="test" onChange={onChange} />);
    const input = screen.getByDisplayValue('test') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'new value' } });
    expect(onChange).toHaveBeenCalledWith('new value');
  });

  it('displays error message', () => {
    render(<Input {...defaultProps} error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('renders disabled state', () => {
    render(<Input {...defaultProps} disabled />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.disabled).toBe(true);
  });

  it('displays required indicator', () => {
    render(<Input {...defaultProps} label="Email" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });
});
