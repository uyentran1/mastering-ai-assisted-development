import { render, screen, fireEvent } from '@testing-library/react';
import { useState } from 'react';
import { Input } from '../src/components/Input';
import type { InputProps } from '../src/types';

function ControlledInput(props: Partial<InputProps>) {
  const [value, setValue] = useState(props.value ?? '');
  return (
    <Input
      label="Email"
      value={value}
      onChange={(next) => setValue(next)}
      {...props}
    />
  );
}

describe('Input', () => {
  it('renders with the provided value', () => {
    render(<Input label="Name" value="Ada" onChange={jest.fn()} />);
    expect(screen.getByLabelText('Name')).toHaveValue('Ada');
  });

  it('renders a label associated with the input via htmlFor/id', () => {
    render(<Input label="Email address" value="" onChange={jest.fn()} />);
    const input = screen.getByLabelText('Email address');
    expect(input.tagName).toBe('INPUT');
  });

  it('generates an id via useId when none is provided', () => {
    render(<Input label="Auto id" value="" onChange={jest.fn()} />);
    const input = screen.getByLabelText('Auto id');
    expect(input.id).toBeTruthy();
  });

  it('uses the provided id instead of generating one', () => {
    render(<Input label="Explicit id" id="custom-id" value="" onChange={jest.fn()} />);
    expect(screen.getByLabelText('Explicit id')).toHaveAttribute('id', 'custom-id');
  });

  it('renders no label element when label is omitted', () => {
    const { container } = render(<Input value="" onChange={jest.fn()} data-testid="wrapper" />);
    expect(container.querySelector('label')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('defaults to type="text"', () => {
    render(<Input label="Text field" value="" onChange={jest.fn()} />);
    expect(screen.getByLabelText('Text field')).toHaveAttribute('type', 'text');
  });

  it('applies the requested native type', () => {
    render(<Input label="Email field" type="email" value="" onChange={jest.fn()} />);
    expect(screen.getByLabelText('Email field')).toHaveAttribute('type', 'email');
  });

  it('calls onChange with the next value and the event', () => {
    const onChange = jest.fn();
    render(<Input label="Name" value="" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Grace' } });
    expect(onChange).toHaveBeenCalledTimes(1);
    const [nextValue, event] = onChange.mock.calls[0];
    expect(nextValue).toBe('Grace');
    expect(event.target).toBeDefined();
  });

  it('behaves as a controlled input, reflecting updated value', () => {
    render(<ControlledInput />);
    const input = screen.getByLabelText('Email');
    fireEvent.change(input, { target: { value: 'a@b.com' } });
    expect(input).toHaveValue('a@b.com');
  });

  it('calls onBlur when the field loses focus', () => {
    const onBlur = jest.fn();
    render(<Input label="Name" value="" onChange={jest.fn()} onBlur={onBlur} />);
    fireEvent.blur(screen.getByLabelText('Name'));
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('is disabled when disabled is true', () => {
    render(<Input label="Name" value="" onChange={jest.fn()} disabled />);
    expect(screen.getByLabelText('Name')).toBeDisabled();
  });

  it('is not disabled by default', () => {
    render(<Input label="Name" value="" onChange={jest.fn()} />);
    expect(screen.getByLabelText('Name')).not.toBeDisabled();
  });

  it('marks the field required and shows a required indicator', () => {
    render(<Input label="Name" value="" onChange={jest.fn()} required />);
    const input = screen.getByLabelText('Name', { exact: false });
    expect(input).toBeRequired();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('shows helperText when validationState is default', () => {
    render(
      <Input label="Name" value="" onChange={jest.fn()} helperText="Enter your full name" />
    );
    expect(screen.getByText('Enter your full name')).toBeInTheDocument();
  });

  it('shows errorMessage and sets aria-invalid when validationState is error', () => {
    render(
      <Input
        label="Name"
        value=""
        onChange={jest.fn()}
        validationState="error"
        errorMessage="Name is required"
      />
    );
    const input = screen.getByLabelText('Name');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText('Name is required')).toBeInTheDocument();
  });

  it('prefers errorMessage over helperText when in error state', () => {
    render(
      <Input
        label="Name"
        value=""
        onChange={jest.fn()}
        validationState="error"
        errorMessage="Name is required"
        helperText="This should be hidden"
      />
    );
    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(screen.queryByText('This should be hidden')).not.toBeInTheDocument();
  });

  it('does not set aria-invalid when validationState is default', () => {
    render(<Input label="Name" value="" onChange={jest.fn()} />);
    expect(screen.getByLabelText('Name')).not.toHaveAttribute('aria-invalid');
  });

  it('wires the description to the input via aria-describedby', () => {
    render(
      <Input
        label="Name"
        value=""
        onChange={jest.fn()}
        validationState="error"
        errorMessage="Required"
      />
    );
    const input = screen.getByLabelText('Name');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy as string)).toHaveTextContent('Required');
  });

  it('applies success validation styling classes', () => {
    render(<Input label="Name" value="" onChange={jest.fn()} validationState="success" />);
    expect(screen.getByLabelText('Name').className).toContain('border-green-500');
  });

  it('applies default md size classes', () => {
    render(<Input label="Name" value="" onChange={jest.fn()} />);
    expect(screen.getByLabelText('Name').className).toContain('py-2');
  });

  it('applies sm size classes', () => {
    render(<Input label="Name" value="" onChange={jest.fn()} size="sm" />);
    expect(screen.getByLabelText('Name').className).toContain('py-1.5');
  });

  it('applies lg size classes', () => {
    render(<Input label="Name" value="" onChange={jest.fn()} size="lg" />);
    expect(screen.getByLabelText('Name').className).toContain('py-2.5');
  });

  it('renders the placeholder text', () => {
    render(<Input label="Name" value="" onChange={jest.fn()} placeholder="Jane Doe" />);
    expect(screen.getByPlaceholderText('Jane Doe')).toBeInTheDocument();
  });

  it('sets the name attribute for form submission', () => {
    render(<Input label="Name" value="" onChange={jest.fn()} name="fullName" />);
    expect(screen.getByLabelText('Name')).toHaveAttribute('name', 'fullName');
  });

  it('forwards data-testid onto the wrapper element', () => {
    render(<Input label="Name" value="" onChange={jest.fn()} data-testid="name-field" />);
    expect(screen.getByTestId('name-field')).toBeInTheDocument();
  });

  it('forwards className onto the wrapper element', () => {
    render(<Input label="Name" value="" onChange={jest.fn()} className="custom-wrapper" />);
    expect(screen.getByTestId).toBeDefined();
    const wrapper = screen.getByLabelText('Name').closest('div');
    expect(wrapper?.className).toContain('custom-wrapper');
  });
});
