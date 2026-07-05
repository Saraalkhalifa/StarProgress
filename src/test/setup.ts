import '@testing-library/jest-dom';

// jsdom (vitest environment) already provides localStorage; just ensure it's clear before each test file.
if (typeof localStorage !== 'undefined') {
  localStorage.clear();
}
