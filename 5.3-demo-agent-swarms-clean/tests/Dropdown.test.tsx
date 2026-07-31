import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dropdown } from '../src/components/Dropdown';
import type { DropdownItem } from '../src/types';

function buildItems(overrides?: Partial<Record<string, Partial<DropdownItem>>>): DropdownItem[] {
  const base: DropdownItem[] = [
    { id: 'edit', label: 'Edit' },
    { id: 'duplicate', label: 'Duplicate', disabled: true },
    { id: 'archive', label: 'Archive' },
    { id: 'delete', label: 'Delete' },
  ];
  if (!overrides) {
    return base;
  }
  return base.map((item) =>
    overrides[item.id] ? { ...item, ...overrides[item.id] } : item
  );
}

function UncontrolledHarness(props: {
  items?: DropdownItem[];
  onSelect?: (item: DropdownItem) => void;
  onOpenChangeSpy?: (open: boolean) => void;
  [key: string]: unknown;
}) {
  const { items = buildItems(), onSelect, onOpenChangeSpy, ...rest } = props;
  return (
    <Dropdown
      trigger="Actions"
      items={items}
      onSelect={onSelect}
      onOpenChange={onOpenChangeSpy}
      {...rest}
    />
  );
}

function ControlledHarness(props: {
  items?: DropdownItem[];
  onSelect?: (item: DropdownItem) => void;
  initialOpen?: boolean;
  [key: string]: unknown;
}) {
  const { items = buildItems(), onSelect, initialOpen = false, ...rest } = props;
  const [open, setOpen] = useState(initialOpen);
  return (
    <Dropdown
      trigger="Actions"
      items={items}
      onSelect={onSelect}
      open={open}
      onOpenChange={setOpen}
      {...rest}
    />
  );
}

describe('Dropdown', () => {
  it('renders the trigger content', () => {
    render(<UncontrolledHarness />);
    expect(screen.getByRole('button')).toHaveTextContent('Actions');
  });

  it('does not render the menu until opened', () => {
    render(<UncontrolledHarness />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('sets aria-haspopup and aria-expanded on the trigger', () => {
    render(<UncontrolledHarness />);
    const trigger = screen.getByRole('button');
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
  });

  it('opens on trigger click and renders all items as menuitems', () => {
    render(<UncontrolledHarness />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.getAllByRole('menuitem')).toHaveLength(4);
  });

  it('closes on a second trigger click (uncontrolled)', () => {
    render(<UncontrolledHarness />);
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.click(trigger);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('starts open when defaultOpen is true (uncontrolled)', () => {
    render(<UncontrolledHarness defaultOpen />);
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('calls onOpenChange in uncontrolled mode', () => {
    const onOpenChangeSpy = jest.fn();
    render(<UncontrolledHarness onOpenChangeSpy={onOpenChangeSpy} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onOpenChangeSpy).toHaveBeenCalledWith(true);
  });

  it('respects the open prop in controlled mode and calls onOpenChange rather than self-managing', () => {
    const onSelect = jest.fn();
    render(<ControlledHarness onSelect={onSelect} initialOpen />);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
    // After selection the controlled harness updates its own `open` state via onOpenChange.
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'edit' }));
  });

  it('stays closed in controlled mode if onOpenChange is ignored', () => {
    render(<Dropdown trigger="Actions" items={buildItems()} open={false} />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('calls the item-level onSelect before the component-level onSelect', () => {
    const callOrder: string[] = [];
    const itemOnSelect = jest.fn(() => callOrder.push('item'));
    const onSelect = jest.fn(() => callOrder.push('component'));
    const items = buildItems({ edit: { onSelect: itemOnSelect } });
    render(<UncontrolledHarness items={items} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(callOrder).toEqual(['item', 'component']);
  });

  it('closes the menu after selecting an item', () => {
    render(<UncontrolledHarness />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Edit' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('does not activate a disabled item on click', () => {
    const onSelect = jest.fn();
    render(<UncontrolledHarness onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Duplicate' }));
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('moves roving focus with ArrowDown, skipping disabled items', () => {
    render(<UncontrolledHarness />);
    fireEvent.click(screen.getByRole('button'));
    const menu = screen.getByRole('menu');
    // Focus starts on first enabled item (Edit).
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    // Duplicate is disabled, so focus should skip to Archive.
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveFocus();
  });

  it('moves roving focus with ArrowUp, wrapping to the last enabled item', () => {
    render(<UncontrolledHarness />);
    fireEvent.click(screen.getByRole('button'));
    const menu = screen.getByRole('menu');
    fireEvent.keyDown(menu, { key: 'ArrowUp' });
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();
  });

  it('jumps to the first and last enabled items with Home and End', () => {
    render(<UncontrolledHarness />);
    fireEvent.click(screen.getByRole('button'));
    const menu = screen.getByRole('menu');
    fireEvent.keyDown(menu, { key: 'End' });
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toHaveFocus();
    fireEvent.keyDown(menu, { key: 'Home' });
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
  });

  it('activates the focused item with Enter', () => {
    const onSelect = jest.fn();
    render(<UncontrolledHarness onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    const menu = screen.getByRole('menu');
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    fireEvent.keyDown(menu, { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'archive' }));
  });

  it('activates the focused item with Space', () => {
    const onSelect = jest.fn();
    render(<UncontrolledHarness onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button'));
    const menu = screen.getByRole('menu');
    fireEvent.keyDown(menu, { key: ' ' });
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'edit' }));
  });

  it('closes on Escape and returns focus to the trigger', () => {
    render(<UncontrolledHarness />);
    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    const menu = screen.getByRole('menu');
    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('opens the menu with ArrowDown from the trigger', () => {
    render(<UncontrolledHarness />);
    const trigger = screen.getByRole('button');
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('does not open when disabled', () => {
    render(<UncontrolledHarness disabled />);
    fireEvent.click(screen.getByRole('button'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('maps placement to the corresponding positioning classes', () => {
    render(<UncontrolledHarness placement="top-end" defaultOpen />);
    const menu = screen.getByRole('menu');
    expect(menu.className).toEqual(expect.stringContaining('bottom-full'));
    expect(menu.className).toEqual(expect.stringContaining('right-0'));
  });

  it('applies data-testid and className to the root element', () => {
    render(<UncontrolledHarness data-testid="actions-dropdown" className="extra-class" />);
    const root = screen.getByTestId('actions-dropdown');
    expect(root).toHaveClass('extra-class');
  });

  it('sets an accessible name on the trigger via the label prop', () => {
    render(<UncontrolledHarness label="Row actions" />);
    expect(screen.getByRole('button', { name: 'Row actions' })).toBeInTheDocument();
  });

  it('closes the menu when clicking outside of it', () => {
    render(
      <div>
        <UncontrolledHarness />
        <button type="button">Outside</button>
      </div>
    );
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Outside' }));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('does not close when clicking inside the menu area', () => {
    render(<UncontrolledHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    fireEvent.mouseDown(screen.getByRole('menu'));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('updates the active item on mouse hover, skipping disabled items', () => {
    render(<UncontrolledHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    const archive = screen.getByRole('menuitem', { name: 'Archive' });
    fireEvent.mouseEnter(archive);
    expect(archive.className).toEqual(expect.stringContaining('bg-blue-50'));

    const duplicate = screen.getByRole('menuitem', { name: 'Duplicate' });
    fireEvent.mouseEnter(duplicate);
    expect(duplicate.className).not.toEqual(expect.stringContaining('bg-blue-50'));
    expect(archive.className).toEqual(expect.stringContaining('bg-blue-50'));
  });

  it('moves roving focus with ArrowDown and ArrowUp fired on the trigger itself while open', () => {
    render(<UncontrolledHarness />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    fireEvent.click(trigger);
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
    fireEvent.keyDown(trigger, { key: 'ArrowDown' });
    expect(screen.getByRole('menuitem', { name: 'Archive' })).toHaveFocus();
    fireEvent.keyDown(trigger, { key: 'ArrowUp' });
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveFocus();
  });

  it('opens the menu with ArrowUp from a closed trigger', () => {
    render(<UncontrolledHarness />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    fireEvent.keyDown(trigger, { key: 'ArrowUp' });
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('does nothing extra on Enter/Space at the trigger when the menu is already open', () => {
    render(<UncontrolledHarness />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    fireEvent.click(trigger);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(trigger, { key: 'Enter' });
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.keyDown(trigger, { key: ' ' });
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('closes on Escape fired at the trigger and keeps focus there', () => {
    render(<UncontrolledHarness />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    fireEvent.click(trigger);
    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('ignores Escape at the trigger when the menu is already closed', () => {
    render(<UncontrolledHarness />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes the menu on Tab within the menu without forcing focus back', () => {
    render(<UncontrolledHarness />);
    fireEvent.click(screen.getByRole('button', { name: 'Actions' }));
    const menu = screen.getByRole('menu');
    fireEvent.keyDown(menu, { key: 'Tab' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('ignores unrelated keys on the trigger and within the menu', () => {
    render(<UncontrolledHarness />);
    const trigger = screen.getByRole('button', { name: 'Actions' });
    fireEvent.keyDown(trigger, { key: 'a' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    fireEvent.click(trigger);
    const menu = screen.getByRole('menu');
    fireEvent.keyDown(menu, { key: 'a' });
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('renders an empty menu without error when there are no items', () => {
    render(<UncontrolledHarness items={[]} defaultOpen />);
    expect(screen.getByRole('menu')).toBeInTheDocument();
    expect(screen.queryAllByRole('menuitem')).toHaveLength(0);
  });

  it('handles keyboard navigation gracefully when every item is disabled', () => {
    const allDisabled = buildItems().map((item) => ({ ...item, disabled: true }));
    render(<UncontrolledHarness items={allDisabled} defaultOpen />);
    const menu = screen.getByRole('menu');
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    fireEvent.keyDown(menu, { key: 'End' });
    fireEvent.keyDown(menu, { key: 'Enter' });
    // No selection should occur and the menu should remain open since nothing was activated.
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('renders leading icons when provided on an item', () => {
    const items = buildItems().map((item) =>
      item.id === 'edit' ? { ...item, icon: <span data-testid="edit-icon" /> } : item
    );
    render(<UncontrolledHarness items={items} defaultOpen />);
    expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
  });
});
