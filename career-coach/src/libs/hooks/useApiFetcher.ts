import { useReducer, useCallback, useRef, useEffect } from 'react';

// Generic types for response + error
export interface ApiState<TResponse = unknown, TError = unknown> {
  response: TResponse | null;
  loading: boolean;
  success: boolean;
  error: TError | null;
}

type FetchingAction = { type: 'FETCHING_API' };
type SuccessAction<T> = { type: 'SUCCESS_API'; payload: T };
type ErrorAction<E> = { type: 'ERROR_API'; payload: E };
type ApiAction<T, E> = FetchingAction | SuccessAction<T> | ErrorAction<E>;

const initialState: ApiState = {
  response: null,
  loading: false,
  success: false,
  error: null,
};

function apiReducer<TResponse, TError>(
  state: ApiState<TResponse, TError> = initialState as ApiState<TResponse, TError>,
  action: ApiAction<TResponse, TError>
): ApiState<TResponse, TError> {
  switch (action.type) {
    case 'FETCHING_API':
      return { ...state, loading: true, success: false, error: null };
    case 'SUCCESS_API':
      return { ...state, response: action.payload, loading: false, success: true, error: null };
    case 'ERROR_API':
      return { ...state, response: null, loading: false, success: false, error: action.payload };
    default:
      return state;
  }
}

export interface RequestOptions extends RequestInit {
  /** Optional custom parser. If provided, overrides default content-type based parsing */
  parse?: (response: Response) => Promise<any>;
  /** Provide an AbortController; one will be created if omitted */
  controller?: AbortController;
}

/**
 * Hook for fetching an API endpoint with lifecycle state and safe dispatch after unmount.
 * @returns [state, makeRequest]
 */
export function useApiFetcher<TResponse = unknown, TError = unknown>() {
  const [state, dispatch] = useReducer(apiReducer<TResponse, TError>, initialState as ApiState<TResponse, TError>);
  const isMounted = useRef(true);
  const activeControllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => {
    isMounted.current = false;
    // Abort any in-flight request on unmount
    activeControllerRef.current?.abort();
  }, []);

  const safeDispatch = useCallback(
    (action: ApiAction<TResponse, TError>) => {
      if (isMounted.current) dispatch(action);
    },
    []
  );

  const makeRequest = useCallback(
    async (url: string, options: RequestOptions = {}): Promise<TResponse | null> => {
      safeDispatch({ type: 'FETCHING_API' });
      const controller = options.controller || new AbortController();
      activeControllerRef.current = controller;
      try {
        const result = await request(url, { ...options, signal: controller.signal });
        safeDispatch({ type: 'SUCCESS_API', payload: result as TResponse });
        return result as TResponse;
      } catch (err: any) {
        // If aborted, treat as error with a standardized shape
        const errorPayload: TError = (err?.name === 'AbortError')
          ? ({ message: 'Request aborted', aborted: true } as any)
          : (err as TError);
        safeDispatch({ type: 'ERROR_API', payload: errorPayload });
        return null;
      } finally {
        activeControllerRef.current = null;
      }
    },
    [safeDispatch]
  );

  return [state, makeRequest] as const;
}

/** Fetch wrapper that throws on HTTP error status and parses body based on content-type */
export async function request(url: string, options: RequestOptions): Promise<any> {
  const { parse, controller, ...fetchOptions } = options;
  const response = await fetch(url, fetchOptions);
  const okResponse = checkStatus(response);
  const cleaned = cleanStatus(okResponse);
  if (cleaned === null) return null;
  if (parse) return parse(response);
  return parseResponse(response);
}

function cleanStatus(response: Response): Response | null {
  if (response.status === 204 || response.status === 205) return null;
  return response;
}

function parseResponse(response: Response): Promise<any> {
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/vnd.openxml')) {
    return response.blob();
  }
  // Default to JSON; fall back to text if JSON fails.
  return response
    .clone()
    .json()
    .catch(() => response.text());
}

function checkStatus(response: Response): Response {
  if (response.status >= 200 && response.status < 300) return response;
  const error: any = new Error(response.statusText || `HTTP ${response.status}`);
  error.status = response.status;
  error.response = response;
  throw error;
}

export default useApiFetcher;