import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState, ErrorState } from './States';

describe('EmptyState', () => {
  it('renders default title', () => {
    render(<EmptyState />);
    expect(screen.getByText('데이터가 없습니다.')).toBeInTheDocument();
  });

  it('renders custom title and description', () => {
    render(<EmptyState title="없음" description="필터에 해당 없음" />);
    expect(screen.getByText('없음')).toBeInTheDocument();
    expect(screen.getByText('필터에 해당 없음')).toBeInTheDocument();
  });
});

describe('ErrorState', () => {
  it('renders default error title with role=alert', () => {
    render(<ErrorState />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('데이터를 불러오지 못했습니다.')).toBeInTheDocument();
  });

  it('invokes onRetry when button clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorState onRetry={onRetry} />);
    await user.click(screen.getByRole('button', { name: /다시 시도/ }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
