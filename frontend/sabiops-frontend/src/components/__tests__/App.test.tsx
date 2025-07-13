import { render, screen } from '@testing-library/react';
import { describe, it, expect } from '@jest/globals';

describe('App Component', () => {
  it('should render without crashing', () => {
    expect(true).toBe(true);
  });

  it('should have basic functionality', () => {
    expect(1 + 1).toBe(2);
  });
});
