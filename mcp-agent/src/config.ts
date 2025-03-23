import dotenv from 'dotenv';

dotenv.config();

// config keys
export const LANGSMITH_DEBUG = 'LANGSMITH_DEBUG';
export const DEBUG_MODE = 'DEBUG_MODE';
export const OPENAI_API_KEY = 'OPENAI_API_KEY';
export const OPENAI_BASE_URL = 'OPENAI_BASE_URL';
export const OPENAI_MAX_TOKENS = 'OPENAI_MAX_TOKENS';

const allConfigFromEnv = () => {
  return {
    [OPENAI_API_KEY]: process.env[OPENAI_API_KEY] || undefined,
    [OPENAI_BASE_URL]: process.env[OPENAI_BASE_URL] || undefined,
    [OPENAI_MAX_TOKENS]: process.env[OPENAI_MAX_TOKENS] || undefined,
    [LANGSMITH_DEBUG]: process.env[LANGSMITH_DEBUG] || undefined,
    [DEBUG_MODE]: process.env[DEBUG_MODE] || undefined,
  };
};

let userConfig: ReturnType<typeof allConfigFromEnv> = {} as any;

export const getAIConfig = (
  configKey: keyof typeof userConfig,
): string | undefined => {
  if (typeof userConfig[configKey] !== 'undefined') {
    return userConfig[configKey];
  }
  return allConfigFromEnv()[configKey];
};
