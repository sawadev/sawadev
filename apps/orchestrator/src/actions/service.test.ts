import { describe, expect, it } from 'bun:test';
import { exitToStatus } from './service';

describe('exitToStatus', () => {
  it('0 → done, sinon failed', () => {
    expect(exitToStatus(0)).toBe('done');
    expect(exitToStatus(1)).toBe('failed');
    expect(exitToStatus(137)).toBe('failed');
  });
});
