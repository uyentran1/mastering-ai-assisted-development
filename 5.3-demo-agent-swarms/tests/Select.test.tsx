import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from '../src/components/Select';

describe('Select Component', () => {
  const options = [
    { value: 'admin', label: 'Administrator' },
    { value: 'user', label: 'User' },
    { value: 'guest', label: 'Guest' },
  ];

  const defaultProps = {
    options,
    value: '',
    onChange: jest.fn(),
  };

  it('renders with label', () => {
    render(<Select {...defaultProps} label="Role" />);
    expect(screen.getByText('Role')).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<Select {...defaultProps} />);
    options.forEach((option) => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
  });

  it('shows placeholder', () => {
    render(<Select {...defaultProps} placeholder="Select a role" />);
    expect(screen.getByText('Select a role')).toBeInTheDocument();
  });

  it('handles change event', () => {
    const onChange = jest.fn();
    render(<Select {...defaultProps} onChange={onChange} />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'admin' } });
    expect(onChange).toHaveBeenCalledWith('admin');
  });

  it('displays error message', () => {
    render(<Select {...defaultProps} error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('renders disabled state', () => {
    render(<Select {...defaultProps} disabled />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.disabled).toBe(true);
  });

  it('displays required indicator', () => {
    render(<Select {...defaultProps} label="Role" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('selects the correct value', () => {
    render(<Select {...defaultProps} value="user" />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('user');
  });
});
