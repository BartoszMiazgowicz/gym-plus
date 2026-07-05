import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ErrorBoundary from './ErrorBoundary';

function Bomb(): never {
    throw new Error('boom');
}

describe('ErrorBoundary', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('renders children when there is no error', () => {
        render(
            <ErrorBoundary>
                <div>Wszystko działa</div>
            </ErrorBoundary>
        );
        expect(screen.getByText('Wszystko działa')).toBeInTheDocument();
    });

    it('shows a recovery screen instead of crashing when a child throws', () => {
        // React logs the caught error to the console; keep the test output clean.
        vi.spyOn(console, 'error').mockImplementation(() => {});

        render(
            <ErrorBoundary>
                <Bomb />
            </ErrorBoundary>
        );

        expect(screen.getByText('Coś poszło nie tak')).toBeInTheDocument();
        expect(screen.getByText('Odśwież stronę')).toBeInTheDocument();
    });
});
