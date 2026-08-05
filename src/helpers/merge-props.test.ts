import { describe, expect, it, vi } from 'vitest';

import { mergeProps } from './merge-props';

describe('mergeProps', () => {
  it('should merge arbitrary props', () => {
    const merged = mergeProps({ 'id': 'id', 'data-testid': 'testid' }, { title: 'title' });

    expect(merged).toEqual({ 'id': 'id', 'data-testid': 'testid', 'title': 'title' });
  });

  it('should overwrite earlier properties with later ones', () => {
    const merged = mergeProps({ id: 'first' }, { id: 'second' });

    expect(merged.id).toBe('second');
  });

  it('should concatenate className values', () => {
    const merged = mergeProps({ className: 'foo' }, { className: 'bar' });

    expect(merged.className).toBe('foo bar');
  });

  it('should handle missing className values gracefully', () => {
    const merged = mergeProps({ id: 'id' }, { className: 'bar' });

    expect(merged.className).toBe('bar');
  });

  it('should chain functions starting with "on"', () => {
    const onClick1 = vi.fn();
    const onClick2 = vi.fn();
    const merged = mergeProps({ onClick: onClick1 }, { onClick: onClick2 });

    merged.onClick('event');

    expect(onClick1).toHaveBeenCalledWith('event');
    expect(onClick2).toHaveBeenCalledWith('event');
  });

  it('should not chain properties starting with "on" that are not functions', () => {
    const merged = mergeProps({ online: false }, { online: true });

    expect(merged.online).toBe(true);
  });

  it('should merge refs using mergeRefs', () => {
    const ref1 = { current: null };
    const ref2 = vi.fn();
    const merged = mergeProps({ ref: ref1 }, { ref: ref2 });

    const value = 'value';
    merged.ref(value);

    expect(ref1.current).toBe(value);
    expect(ref2).toHaveBeenCalledWith(value);
  });

  it('should merge more than two props objects', () => {
    const onClick1 = vi.fn();
    const onClick2 = vi.fn();
    const onClick3 = vi.fn();
    const merged = mergeProps(
      { className: 'foo', onClick: onClick1 },
      { className: 'bar', onClick: onClick2 },
      { className: 'baz', onClick: onClick3 },
    );

    merged.onClick('event');

    expect(merged.className).toBe('foo bar baz');
    expect(onClick1).toHaveBeenCalledWith('event');
    expect(onClick2).toHaveBeenCalledWith('event');
    expect(onClick3).toHaveBeenCalledWith('event');
  });
});
