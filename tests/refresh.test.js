import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    initRefreshPort,
    refreshFull,
    refreshPreview,
    refreshUi,
} from '../src/foundation/refresh.js';

describe('refresh port', () => {
    let updateInjection;
    let updateUI;
    let updatePreview;

    beforeEach(() => {
        updateInjection = vi.fn();
        updateUI = vi.fn();
        updatePreview = vi.fn();
        initRefreshPort({ updateInjection, updateUI, updatePreview });
    });

    it('refreshUi fires only the UI effect', () => {
        refreshUi();

        expect(updateUI).toHaveBeenCalledTimes(1);
        expect(updateInjection).not.toHaveBeenCalled();
        expect(updatePreview).not.toHaveBeenCalled();
    });

    it('refreshFull fires injection before the UI render that reads injection-derived state', () => {
        refreshFull();

        expect(updateInjection).toHaveBeenCalledTimes(1);
        expect(updateUI).toHaveBeenCalledTimes(1);
        expect(updateInjection.mock.invocationCallOrder[0]).toBeLessThan(
            updateUI.mock.invocationCallOrder[0],
        );
        expect(updatePreview).not.toHaveBeenCalled();
    });

    it('refreshPreview fires injection then the preview without the full UI render', () => {
        refreshPreview();

        expect(updateInjection).toHaveBeenCalledTimes(1);
        expect(updatePreview).toHaveBeenCalledTimes(1);
        expect(updateInjection.mock.invocationCallOrder[0]).toBeLessThan(
            updatePreview.mock.invocationCallOrder[0],
        );
        expect(updateUI).not.toHaveBeenCalled();
    });
});

describe('unregistered refresh port', () => {
    it('treats unregistered and missing port effects as silent no-ops', async () => {
        vi.resetModules();
        const unregistered = await import('../src/foundation/refresh.js');

        expect(() => unregistered.refreshUi()).not.toThrow();
        expect(() => unregistered.refreshFull()).not.toThrow();
        expect(() => unregistered.refreshPreview()).not.toThrow();

        // A partially registered port still runs the effects it has.
        const updateUI = vi.fn();
        unregistered.initRefreshPort({ updateUI });

        expect(() => unregistered.refreshFull()).not.toThrow();
        expect(updateUI).toHaveBeenCalledTimes(1);
    });
});
