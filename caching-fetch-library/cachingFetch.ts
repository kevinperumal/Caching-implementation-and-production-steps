import { useEffect, useState } from "react";

// You may edit this file, add new files to support this file,
// and/or add new dependencies to the project as you see fit.
// However, you must not change the surface API presented from this file,
// and you should not need to change any other files in the project to complete the challenge

type UseCachingFetch = (url: string) => StateData

type StateData = {
  isLoading: boolean;
  data: unknown;
  error: Error | null;
};

type CacheEntries = [string, unknown][];

const cache = new Map();

/**
 * 1. Implement a caching fetch hook. The hook should return an object with the following properties:
 * - isLoading: a boolean that is true when the fetch is in progress and false otherwise
 * - data: the data returned from the fetch, or null if the fetch has not completed
 * - error: an error object if the fetch fails, or null if the fetch is successful
 *
 * This hook is called three times on the client:
 *  - 1 in App.tsx
 *  - 2 in Person.tsx
 *  - 3 in Name.tsx
 *
 * Acceptance Criteria:
 * 1. The application at /appWithoutSSRData should properly render, with JavaScript enabled, you should see a list of people.
 * 2. You should only see 1 network request in the browser's network tab when visiting the /appWithoutSSRData route.
 * 3. You have not changed any code outside of this file to achieve this.
 * 4. This file passes a type-check.
 *
 */
export const useCachingFetch: UseCachingFetch = (url) => {
  const [state, setState] = useState({
    data: null,
    isLoading: false,
    error: null
  });

  useEffect(() => {
    if (cache.has(url)) {
      setState({ ...state, data: cache.get(url) });
    } else {
      fetchData(url, state, setState);
    }
  }, [url]);

  return state;
};

async function fetchData(url: string, state: StateData, setState: any) {
  setState({ ...state, isLoading: true });

  await fetchAndCacheData(
    url,
    (data) => setState({ ...state, isLoading: false, data }),
    (error) => setState({ ...state, isLoading: false, error })
  );
}
async function fetchAndCacheData(
  url: string,
  onSuccess?: (data: unknown) => void,
  onError?: (error: Error) => void
): Promise<unknown> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch in fetchAndCacheData: ${response.statusText}`);
    }
    const data = await response.json();
    cache.set(url, data);

    if (onSuccess) {
      onSuccess(data);
    }

    return data;
  } catch (error) {
    if (onError) {
      onError(error as Error);
    }
    throw error;
  }
}



/**
 * 2. Implement a preloading caching fetch function. The function should fetch the data.
 *
 * This function will be called once on the server before any rendering occurs.
 *
 * Any subsequent call to useCachingFetch should result in the returned data being available immediately.
 * Meaning that the page should be completely serverside rendered on /appWithSSRData
 *
 * Acceptance Criteria:
 * 1. The application at /appWithSSRData should properly render, with JavaScript disabled, you should see a list of people.
 * 2. You have not changed any code outside of this file to achieve this.
 * 3. This file passes a type-check.
 *
 */
export const preloadCachingFetch = async (url: string): Promise<void> => {
  await fetchAndCacheData(url);
};

/**
 * 3.1 Implement a serializeCache function that serializes the cache to a string.
 * 3.2 Implement an initializeCache function that initializes the cache from a serialized cache string.
 *
 * Together, these two functions will help the framework transfer your cache to the browser.
 *
 * The framework will call `serializeCache` on the server to serialize the cache to a string and inject it into the dom.
 * The framework will then call `initializeCache` on the browser with the serialized cache string to initialize the cache.
 *
 * Acceptance Criteria:
 * 1. The application at /appWithSSRData should properly render, with JavaScript enabled, you should see a list of people.
 * 2. You should not see any network calls to the people API when visiting the /appWithSSRData route.
 * 3. You have not changed any code outside of this file to achieve this.
 * 4. This file passes a type-check.
 *
 */
export const serializeCache = (): string => {
  return JSON.stringify([...cache.entries()]);
};

export const initializeCache = (serializedCache: string): void => {
  const entries: CacheEntries = JSON.parse(serializedCache);
  entries.forEach(([url, data]) => {
    cache.set(url, data);
  });
};

export const wipeCache = (): void => {
  cache.clear();
};