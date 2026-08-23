import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const AppSettingsContext = createContext(null);

const STORAGE_KEY = 'washek_app_settings';

const DEFAULT_SETTINGS = {
  country: '',
  language: 'English',
  unit: 'imperial',
  theme: 'dark',
};

function getStoredSettings() {
  if (typeof window === 'undefined') {
    return DEFAULT_SETTINGS;
  }

  try {
    const stored = window.localStorage.getItem(
      STORAGE_KEY
    );

    if (!stored) {
      return DEFAULT_SETTINGS;
    }

    const parsed = JSON.parse(stored);

    return {
      ...DEFAULT_SETTINGS,
      ...parsed,

      // Never allow an invalid/missing theme
      // to fall through to browser preference.
      theme:
        parsed?.theme === 'light'
          ? 'light'
          : 'dark',
    };
  } catch (error) {
    console.warn(
      '[APP SETTINGS] Failed to read stored settings:',
      error
    );

    return DEFAULT_SETTINGS;
  }
}

function applyTheme(theme) {
  if (typeof document === 'undefined') {
    return;
  }

  const root =
    document.documentElement;

  const normalizedTheme =
    theme === 'light'
      ? 'light'
      : 'dark';

  root.classList.remove(
    'dark',
    'light'
  );

  root.classList.add(
    normalizedTheme
  );

  root.setAttribute(
    'data-theme',
    normalizedTheme
  );

  /*
   * Tell the browser that our application is
   * deliberately using the selected color scheme.
   *
   * This also affects native controls such as
   * inputs, selects, scrollbars, etc.
   */
  root.style.colorScheme =
    normalizedTheme;
}

export function AppSettingsProvider({
  children,
}) {
  const [settings, setSettings] =
    useState(() => getStoredSettings());

  /*
   * Apply the theme immediately whenever
   * settings.theme changes.
   */
  useEffect(() => {
    applyTheme(settings.theme);
  }, [settings.theme]);

  /*
   * Persist settings.
   */
  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(settings)
      );
    } catch (error) {
      console.warn(
        '[APP SETTINGS] Failed to save settings:',
        error
      );
    }
  }, [settings]);

  const updateSettings = useCallback(
    (updates) => {
      setSettings((previous) => {
        const next = {
          ...previous,
          ...updates,
        };

        /*
         * Normalize theme so undefined/null/
         * invalid values can never cause the
         * application to fall back to the OS.
         */
        next.theme =
          next.theme === 'light'
            ? 'light'
            : 'dark';

        return next;
      });
    },
    []
  );

  const setTheme = useCallback(
    (theme) => {
      const nextTheme =
        theme === 'light'
          ? 'light'
          : 'dark';

      setSettings((previous) => ({
        ...previous,
        theme: nextTheme,
      }));

      /*
       * Apply immediately instead of waiting
       * for another render.
       */
      applyTheme(nextTheme);
    },
    []
  );

  const toggleTheme = useCallback(() => {
    setSettings((previous) => {
      const nextTheme =
        previous.theme === 'dark'
          ? 'light'
          : 'dark';

      applyTheme(nextTheme);

      return {
        ...previous,
        theme: nextTheme,
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      settings,

      /*
       * Preserve the existing API used by the
       * rest of the application.
       */
      updateSettings,

      /*
       * Explicit theme controls.
       */
      theme: settings.theme,
      setTheme,
      toggleTheme,
    }),
    [
      settings,
      updateSettings,
      setTheme,
      toggleTheme,
    ]
  );

  return (
    <AppSettingsContext.Provider
      value={value}
    >
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const context =
    useContext(AppSettingsContext);

  if (!context) {
    throw new Error(
      'useAppSettings must be used inside an AppSettingsProvider.'
    );
  }

  return context;
}

export default AppSettingsContext;
