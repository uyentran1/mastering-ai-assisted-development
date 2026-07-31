import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../src/components/Button';

describe('Button', () => {
  it('renders children as text content', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('defaults to type="button"', () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('renders the requested native type', () => {
    render(<Button type="submit">Submit</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('defaults to the primary variant classes', () => {
    render(<Button>Default</Button>);
    expect(screen.getByRole('button').className).toContain('bg-blue-600');
  });

  it('applies secondary variant classes', () => {
    render(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button').className).toContain('bg-white');
  });

  it('applies danger variant classes', () => {
    render(<Button variant="danger">Danger</Button>);
    expect(screen.getByRole('button').className).toContain('bg-red-600');
  });

  it('defaults to the md size classes', () => {
    render(<Button>Default size</Button>);
    expect(screen.getByRole('button').className).toContain('px-4');
  });

  it('applies sm size classes', () => {
    render(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button').className).toContain('px-3');
  });

  it('applies lg size classes', () => {
    render(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button').className).toContain('px-5');
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not throw when clicked without an onClick handler', () => {
    render(<Button>No handler</Button>);
    expect(() => fireEvent.click(screen.getByRole('button'))).not.toThrow();
  });

  it('does not call onClick when disabled', () => {
    const onClick = jest.fn();
    render(
      <Button disabled onClick={onClick}>
        Disabled
      </Button>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('sets the disabled attribute when disabled', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('does not call onClick while loading', () => {
    const onClick = jest.fn();
    render(
      <Button loading onClick={onClick}>
        Loading
      </Button>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('treats loading as disabled', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('sets aria-busy when loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
  });

  it('does not set aria-busy when not loading', () => {
    render(<Button>Not loading</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'false');
  });

  it('renders a spinner while loading', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByTestId('button-spinner')).toBeInTheDocument();
  });

  it('does not render a spinner when not loading', () => {
    render(<Button>Not loading</Button>);
    expect(screen.queryByTestId('button-spinner')).not.toBeInTheDocument();
  });

  it('applies full width class when fullWidth is set', () => {
    render(<Button fullWidth>Wide</Button>);
    expect(screen.getByRole('button').className).toContain('w-full');
  });

  it('omits full width class by default', () => {
    render(<Button>Narrow</Button>);
    expect(screen.getByRole('button').className).not.toContain('w-full');
  });

  it('forwards aria-label for icon-only buttons', () => {
    render(<Button aria-label="Close dialog">X</Button>);
    expect(screen.getByRole('button', { name: 'Close dialog' })).toBeInTheDocument();
  });

  it('forwards className onto the root element', () => {
    render(<Button className="custom-class">Styled</Button>);
    expect(screen.getByRole('button').className).toContain('custom-class');
  });

  it('forwards data-testid onto the root element', () => {
    render(<Button data-testid="my-button">Test</Button>);
    expect(screen.getByTestId('my-button')).toBeInTheDocument();
  });

  it('forwards id onto the root element', () => {
    render(<Button id="save-button">Save</Button>);
    expect(screen.getByRole('button')).toHaveAttribute('id', 'save-button');
  });
});
