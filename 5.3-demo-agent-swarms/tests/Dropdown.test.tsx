import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dropdown } from '../src/components/Dropdown';

describe('Dropdown Component', () => {
  const items = [
    { id: 'edit', label: 'Edit' },
    { id: 'delete', label: 'Delete' },
    { id: 'share', label: 'Share' },
  ];

  const defaultProps = {
    trigger: 'Actions',
    items,
    onSelect: jest.fn(),
  };

  it('renders trigger button', () => {
    render(<Dropdown {...defaultProps} />);
    expect(screen.getByText('Actions')).toBeInTheDocument();
  });

  it('shows menu items when clicked', () => {
    render(<Dropdown {...defaultProps} />);
    const trigger = screen.getByText('Actions') as HTMLButtonElement;
    fireEvent.click(trigger);

    items.forEach((item) => {
      expect(screen.getByText(item.label)).toBeInTheDocument();
    });
  });

  it('calls onSelect when item is clicked', () => {
    const onSelect = jest.fn();
    render(<Dropdown {...defaultProps} onSelect={onSelect} />);

    const trigger = screen.getByText('Actions') as HTMLButtonElement;
    fireEvent.click(trigger);

    const deleteItem = screen.getByText('Delete');
    fireEvent.click(deleteItem);

    expect(onSelect).toHaveBeenCalledWith('delete');
  });

  it('closes menu after selecting item', () => {
    render(<Dropdown {...defaultProps} />);

    const trigger = screen.getByText('Actions') as HTMLButtonElement;
    fireEvent.click(trigger);

    expect(screen.getByText('Edit')).toBeInTheDocument();

    const editItem = screen.getByText('Edit');
    fireEvent.click(editItem);

    // Menu should be hidden after selection
    expect(screen.queryByText('Delete')).not.toBeInTheDocument();
  });

  it('renders disabled state', () => {
    render(<Dropdown {...defaultProps} disabled />);
    const trigger = screen.getByText('Actions') as HTMLButtonElement;
    expect(trigger.disabled).toBe(true);
  });

  it('does not open menu when disabled', () => {
    render(<Dropdown {...defaultProps} disabled />);
    const trigger = screen.getByText('Actions') as HTMLButtonElement;
    fireEvent.click(trigger);

    // Menu should not appear
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('closes menu when clicking outside', () => {
    render(
      <div>
        <Dropdown {...defaultProps} />
        <div data-testid="outside">Outside element</div>
      </div>
    );

    const trigger = screen.getByText('Actions') as HTMLButtonElement;
    fireEvent.click(trigger);

    expect(screen.getByText('Edit')).toBeInTheDocument();

    const outside = screen.getByTestId('outside');
    fireEvent.mouseDown(outside);

    // Menu should be closed
    expect(screen.queryByText('Edit')).not.toBeInTheDocument();
  });

  it('handles disabled items', () => {
    const itemsWithDisabled = [
      { id: 'edit', label: 'Edit' },
      { id: 'delete', label: 'Delete', disabled: true },
    ];

    const onSelect = jest.fn();
    render(
      <Dropdown
        trigger="Actions"
        items={itemsWithDisabled}
        onSelect={onSelect}
      />
    );

    const trigger = screen.getByText('Actions') as HTMLButtonElement;
    fireEvent.click(trigger);

    const deleteItem = screen.getByText('Delete') as HTMLButtonElement;
    expect(deleteItem.disabled).toBe(true);
  });
});
