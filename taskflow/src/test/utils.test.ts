import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime, spotsLeft, statusLabel } from '../utils';

describe('formatDate', () => {
  it('formats ISO date string', () => {
    const result = formatDate('2026-07-15T10:00:00');
    expect(result).toContain('2026');
    expect(result).toContain('07');
    expect(result).toContain('15');
  });
});

describe('formatDateTime', () => {
  it('includes time in output', () => {
    const result = formatDateTime('2026-07-15T10:30:00');
    expect(result).toContain('2026');
    expect(result).toContain('10');
    expect(result).toContain('30');
  });
});

describe('spotsLeft', () => {
  it('returns positive when below capacity', () => {
    expect(spotsLeft({ max_capacity: 50, current_participants: 30 })).toBe(20);
  });

  it('returns zero when full', () => {
    expect(spotsLeft({ max_capacity: 50, current_participants: 50 })).toBe(0);
  });

  it('returns negative when over capacity', () => {
    expect(spotsLeft({ max_capacity: 50, current_participants: 55 })).toBe(-5);
  });
});

describe('statusLabel', () => {
  it('maps published status', () => {
    expect(statusLabel('published')).toBe('Published');
  });

  it('maps draft status', () => {
    expect(statusLabel('draft')).toBe('Draft');
  });

  it('maps confirmed status', () => {
    expect(statusLabel('confirmed')).toBe('Confirmed');
  });

  it('returns raw string for unknown status', () => {
    expect(statusLabel('unknown_xyz')).toBe('unknown_xyz');
  });
});
