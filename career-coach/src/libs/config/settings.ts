// Configuration management for API keys and settings

export const CRUNCHBASE_API_KEY = process.env.CRUNCHBASE_API_KEY || '';
export const GLASSDOOR_API_KEY = process.env.GLASSDOOR_API_KEY || '';
export const NEWS_API_KEY = process.env.NEWS_API_KEY || '';

if (!CRUNCHBASE_API_KEY || !GLASSDOOR_API_KEY || !NEWS_API_KEY) {
	// Optionally warn in dev mode
	if (process.env.NODE_ENV !== 'production') {
		// eslint-disable-next-line no-console
		console.warn('Some API keys are missing in .env.local');
	}
}
