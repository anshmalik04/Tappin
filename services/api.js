async function apiFetch(path, options = {}) {
  let token;
  try {
    const session = await fetchAuthSession();
    token = session.tokens?.idToken?.toString();
  } catch (err) {
    console.log('[DEBUG] fetchAuthSession error:', err?.message || err);
    token = null;
  }

  const staticToken = await AsyncStorage.getItem('tappin_jwt');
  console.log('[DEBUG] fetchAuthSession token:', token ? `present (${token.length} chars)` : 'none/undefined');
  console.log('[DEBUG] AsyncStorage tappin_jwt:', staticToken ? `present (${staticToken.length} chars)` : 'none/empty');

  const makeRequest = async (authToken) => {
    const headers = {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...options.headers,
    };

    return fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  };

  let response = await makeRequest(token);

  // If we get a 401, the token may have expired mid-session.
  // Force a refresh and retry once before giving up.
  if (response.status === 401) {
    console.log('[DEBUG] 401 received — attempting token refresh...');
    try {
      const refreshedSession = await fetchAuthSession({ forceRefresh: true });
      const refreshedToken = refreshedSession.tokens?.idToken?.toString();
      if (refreshedToken) {
        console.log('[DEBUG] Token refreshed — retrying request...');
        response = await makeRequest(refreshedToken);
      }
    } catch (refreshErr) {
      console.log('[DEBUG] Token refresh failed:', refreshErr?.message || refreshErr);
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}