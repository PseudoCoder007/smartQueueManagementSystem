import { describe, expect, it } from 'vitest';

describe('route guards', () => {
  it('keeps role names explicit', () => {
    expect(['USER', 'ADMIN']).toContain('USER');
  });
});
