import { describe, expect, it } from 'vitest';

import { ConnectionError } from '../src/core/connection-error.js';
import { tryExtractChatContent } from '../src/core/connection-transport.js';

describe('ConnectionError', () => {
    it('defaults to a non-retryable error with a null status', () => {
        const err = new ConnectionError('boom');
        expect(err).toBeInstanceOf(Error);
        expect(err.name).toBe('ConnectionError');
        expect(err.message).toBe('boom');
        expect(err.retryable).toBe(false);
        expect(err.status).toBeNull();
    });

    it('honors explicit retryable and status options', () => {
        const err = new ConnectionError('rate limited', { retryable: true, status: 429 });
        expect(err.retryable).toBe(true);
        expect(err.status).toBe(429);
    });
});

describe('tryExtractChatContent', () => {
    it.each([[null], [undefined], [42], ['string']])(
        'returns null for a non-object input (%s)',
        (input) => {
            expect(tryExtractChatContent(input)).toBeNull();
        },
    );

    it('returns a top-level content string directly', () => {
        expect(tryExtractChatContent({ content: 'hello' })).toBe('hello');
    });

    it('falls back to message.content', () => {
        expect(tryExtractChatContent({ message: { content: 'from message' } })).toBe(
            'from message',
        );
    });

    it('falls back to choices[0].message.content then choices[0].delta.content', () => {
        expect(
            tryExtractChatContent({ choices: [{ message: { content: 'choice message' } }] }),
        ).toBe('choice message');
        expect(tryExtractChatContent({ choices: [{ delta: { content: 'choice delta' } }] })).toBe(
            'choice delta',
        );
    });

    it('returns null when no candidate is a string', () => {
        expect(tryExtractChatContent({ content: 123 })).toBeNull();
        expect(tryExtractChatContent({ choices: 'not-an-array' })).toBeNull();
    });

    it('prefers a top-level content string over message.content', () => {
        expect(
            tryExtractChatContent({ content: 'top wins', message: { content: 'message loses' } }),
        ).toBe('top wins');
    });
});
