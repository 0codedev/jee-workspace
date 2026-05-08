export const togglePrivacyMode = (): boolean => {
  if (typeof document === 'undefined') return false;
  const isEnabled = document.body.classList.toggle('privacy-mode');
  return isEnabled;
};

export const initPrivacyModeListener = (onToggle?: (enabled: boolean) => void) => {
  if (typeof window === 'undefined') return () => {};

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'p') {
      e.preventDefault();
      const enabled = togglePrivacyMode();
      if (onToggle) onToggle(enabled);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
};
