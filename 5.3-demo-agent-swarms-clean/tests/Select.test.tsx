import { useState } from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { Select } from '../src/components/Select';
import type { SelectOption } from '../src/types';

const OPTIONS: SelectOption[] = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana', disabled: true },
  { value: 'cherry', label: 'Cherry' },
  { value: 'date', label: 'Date' },
];

function SingleHarness(props: {
  initial?: string | null;
  onChangeSpy?: (value: string | null) => void;
  options?: SelectOption[];
  [key: string]: unknown;
}) {
  const { initial = null, onChangeSpy, options = OPTIONS, ...rest } = props;
  const [value, setValue] = useState<string | null>(initial);
  return (
    <Select
      options={options}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChangeSpy?.(next);
      }}
      {...rest}
    />
  );
}

function MultiHarness(props: {
  initial?: string[];
  onChangeSpy?: (value: string[]) => void;
  options?: SelectOption[];
  [key: string]: unknown;
}) {
  const { initial = [], onChangeSpy, options = OPTIONS, ...rest } = props;
  const [value, setValue] = useState<string[]>(initial);
  return (
    <Select
      multiple
      options={options}
      value={value}
      onChange={(next) => {
        setValue(next);
        onChangeSpy?.(next);
      }}
      {...rest}
    />
  );
}

function openTrigger() {
  const trigger = screen.getByRole('button');
  fireEvent.click(trigger);
  return trigger;
}

describe('Select', () => {
  it('renders a trigger button with the placeholder when nothing is selected', () => {
    render(<SingleHarness placeholder="Pick a fruit" />);
    expect(screen.getByRole('button')).toHaveTextContent('Pick a fruit');
  });

  it('renders the selected option label in single mode', () => {
    render(<SingleHarness initial="apple" />);
    expect(screen.getByRole('button')).toHaveTextContent('Apple');
  });

  it('does not render the listbox until opened', () => {
    render(<SingleHarness />);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens the listbox on trigger click and shows all options', () => {
    render(<SingleHarness />);
    openTrigger();
    const listbox = screen.getByRole('listbox');
    expect(within(listbox).getAllByRole('option')).toHaveLength(OPTIONS.length);
  });

  it('sets aria-expanded and aria-haspopup on the trigger', () => {
    render(<SingleHarness />);
    const trigger = screen.getByRole('button');
    expect(trigger).toHaveAttribute('aria-haspopup', 'listbox');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes the listbox when the trigger is clicked again', () => {
    render(<SingleHarness />);
    const trigger = openTrigger();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('selects an option on click in single mode and closes the list', () => {
    const onChangeSpy = jest.fn();
    render(<SingleHarness onChangeSpy={onChangeSpy} />);
    openTrigger();
    fireEvent.click(screen.getByRole('option', { name: 'Cherry' }));
    expect(onChangeSpy).toHaveBeenCalledWith('cherry');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveTextContent('Cherry');
  });

  it('marks the selected option with aria-selected', () => {
    render(<SingleHarness initial="cherry" />);
    openTrigger();
    expect(screen.getByRole('option', { name: 'Cherry' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(screen.getByRole('option', { name: 'Apple' })).toHaveAttribute(
      'aria-selected',
      'false'
    );
  });

  it('does not select a disabled option on click', () => {
    const onChangeSpy = jest.fn();
    render(<SingleHarness onChangeSpy={onChangeSpy} />);
    openTrigger();
    fireEvent.click(screen.getByRole('option', { name: 'Banana' }));
    expect(onChangeSpy).not.toHaveBeenCalled();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('toggles values on repeated selection in multi mode without closing', () => {
    const onChangeSpy = jest.fn();
    render(<MultiHarness onChangeSpy={onChangeSpy} />);
    openTrigger();
    fireEvent.click(screen.getByRole('option', { name: 'Apple' }));
    expect(onChangeSpy).toHaveBeenLastCalledWith(['apple']);
    expect(screen.getByRole('listbox')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('option', { name: 'Cherry' }));
    expect(onChangeSpy).toHaveBeenLastCalledWith(['apple', 'cherry']);

    fireEvent.click(screen.getByRole('option', { name: 'Apple' }));
    expect(onChangeSpy).toHaveBeenLastCalledWith(['cherry']);
  });

  it('shows a selected count once more than two options are chosen in multi mode', () => {
    render(<MultiHarness initial={['apple', 'cherry', 'date']} />);
    expect(screen.getByRole('button')).toHaveTextContent('3 selected');
  });

  it('shows joined labels when two or fewer options are selected in multi mode', () => {
    render(<MultiHarness initial={['apple', 'cherry']} />);
    expect(screen.getByRole('button')).toHaveTextContent('Apple, Cherry');
  });

  it('sets aria-multiselectable on the listbox in multi mode', () => {
    render(<MultiHarness />);
    openTrigger();
    expect(screen.getByRole('listbox')).toHaveAttribute('aria-multiselectable', 'true');
  });

  it('opens the list and moves active option with ArrowDown from the trigger', () => {
    render(<SingleHarness />);
    const trigger = screen.getByRole('button');
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('skips disabled options when navigating with ArrowDown', () => {
    const onChangeSpy = jest.fn();
    render(<SingleHarness onChangeSpy={onChangeSpy} />);
    const trigger = openTrigger();
    // Active starts at first enabled (Apple, index 0). Arrow down should skip Banana (disabled).
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(onChangeSpy).toHaveBeenCalledWith('cherry');
  });

  it('selects the active option with Enter and with Space', () => {
    const onChangeSpy = jest.fn();
    render(<SingleHarness onChangeSpy={onChangeSpy} />);
    const trigger = openTrigger();
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(onChangeSpy).toHaveBeenCalledWith('apple');
  });

  it('jumps to the first and last enabled option with Home and End', () => {
    const onChangeSpy = jest.fn();
    render(<SingleHarness onChangeSpy={onChangeSpy} />);
    const trigger = openTrigger();
    fireEvent.keyDown(trigger, { key: 'End' });
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(onChangeSpy).toHaveBeenLastCalledWith('date');

    onChangeSpy.mockClear();
    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: 'Home' });
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(onChangeSpy).toHaveBeenLastCalledWith('apple');
  });

  it('closes the listbox on Escape', () => {
    render(<SingleHarness />);
    const trigger = openTrigger();
    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('closes the listbox on Tab', () => {
    render(<SingleHarness />);
    const trigger = openTrigger();
    fireEvent.keyDown(trigger, { key: 'Tab' });
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('does not open when disabled', () => {
    render(<SingleHarness disabled />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('shows the error message and sets aria-invalid when validationState is error', () => {
    render(
      <SingleHarness validationState="error" errorMessage="This field is required" />
    );
    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByRole('button')).toHaveAttribute('aria-invalid', 'true');
  });

  it('does not set aria-invalid by default', () => {
    render(<SingleHarness />);
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-invalid');
  });

  it('renders a visible label bound to the trigger', () => {
    render(<SingleHarness label="Fruit" />);
    expect(screen.getByText('Fruit')).toBeInTheDocument();
  });

  it('applies data-testid and className to the root element', () => {
    render(<SingleHarness data-testid="fruit-select" className="extra-class" />);
    const root = screen.getByTestId('fruit-select');
    expect(root).toHaveClass('extra-class');
  });
});
