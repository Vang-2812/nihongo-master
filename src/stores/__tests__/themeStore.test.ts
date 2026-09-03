import test, { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { useThemeStore } from '../themeStore';

describe('useThemeStore', () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: 'system', resolvedTheme: 'light' });
  });

  it('should initialize with system theme', () => {
    const store = useThemeStore.getState();
    assert.equal(store.theme, 'system');
  });

  it('should change theme to light and dark explicitly', () => {
    const store = useThemeStore.getState();

    store.setTheme('dark');
    assert.equal(useThemeStore.getState().theme, 'dark');
    assert.equal(useThemeStore.getState().resolvedTheme, 'dark');

    store.setTheme('light');
    assert.equal(useThemeStore.getState().theme, 'light');
    assert.equal(useThemeStore.getState().resolvedTheme, 'light');
  });

  it('should cycle theme via toggleTheme', () => {
    const store = useThemeStore.getState();

    // From system -> dark
    store.setTheme('system');
    store.toggleTheme();
    assert.equal(useThemeStore.getState().theme, 'dark');

    // From dark -> light
    store.toggleTheme();
    assert.equal(useThemeStore.getState().theme, 'light');

    // From light -> system
    store.toggleTheme();
    assert.equal(useThemeStore.getState().theme, 'system');
  });
});
