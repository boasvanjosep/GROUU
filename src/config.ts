/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { isAllowedGasUrl } from './utils/gasUrl';

export interface AppConfig {
  gasUrl: string;
  sheetsUrl: string;
  calendarUrl: string;
  userName: string;
  userRole: string;
  grouuToken: string;
  workspaceId: string;
}

const STORAGE_KEYS = {
  GAS_URL: 'grouu_gas_url',
  SHEETS_URL: 'grouu_sheets_url',
  CALENDAR_URL: 'grouu_calendar_url',
  USER_NAME: 'grouu_user_name',
  USER_ROLE: 'grouu_user_role',
  GROUU_TOKEN: 'grouu_token',
} as const;

export const SAFE_EMPTY_CONFIG: AppConfig = {
  gasUrl: '',
  sheetsUrl: '',
  calendarUrl: '',
  userName: '',
  userRole: 'Local Workspace',
  grouuToken: '',
  workspaceId: 'local',
};

const readSetting = (key: string): string => {
  try {
    return localStorage.getItem(key) ?? '';
  } catch {
    return '';
  }
};

const normalizeUrl = (value: string): string => value.trim();

const hashWorkspace = (value: string): string => {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
};

export const isSafeExternalUrl = (value: string, allowedHosts: string[]): boolean => {
  if (!value) return false;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && allowedHosts.includes(url.hostname);
  } catch {
    return false;
  }
};

export const getAppConfig = (): AppConfig => {
  const gasUrl = normalizeUrl(readSetting(STORAGE_KEYS.GAS_URL));
  const sheetsUrl = normalizeUrl(readSetting(STORAGE_KEYS.SHEETS_URL));
  const calendarUrl = normalizeUrl(readSetting(STORAGE_KEYS.CALENDAR_URL));
  const userName = readSetting(STORAGE_KEYS.USER_NAME).trim();
  const userRole = readSetting(STORAGE_KEYS.USER_ROLE).trim() || SAFE_EMPTY_CONFIG.userRole;
  const grouuToken = readSetting(STORAGE_KEYS.GROUU_TOKEN).trim();

  return {
    gasUrl,
    sheetsUrl,
    calendarUrl,
    userName,
    userRole,
    grouuToken,
    workspaceId: gasUrl && isAllowedGasUrl(gasUrl) ? hashWorkspace(gasUrl) : SAFE_EMPTY_CONFIG.workspaceId,
  };
};

export const updateAppConfig = (
  gasUrl: string,
  sheetsUrl: string,
  calendarUrl: string,
  userName: string,
  userRole: string,
  grouuToken: string
) => {
  localStorage.setItem(STORAGE_KEYS.GAS_URL, normalizeUrl(gasUrl));
  localStorage.setItem(STORAGE_KEYS.SHEETS_URL, normalizeUrl(sheetsUrl));
  localStorage.setItem(STORAGE_KEYS.CALENDAR_URL, normalizeUrl(calendarUrl));
  localStorage.setItem(STORAGE_KEYS.USER_NAME, userName.trim());
  localStorage.setItem(STORAGE_KEYS.USER_ROLE, userRole.trim() || SAFE_EMPTY_CONFIG.userRole);
  localStorage.setItem(STORAGE_KEYS.GROUU_TOKEN, grouuToken.trim());
};

export const resetAppConfig = () => {
  localStorage.removeItem(STORAGE_KEYS.GAS_URL);
  localStorage.removeItem(STORAGE_KEYS.SHEETS_URL);
  localStorage.removeItem(STORAGE_KEYS.CALENDAR_URL);
  localStorage.removeItem(STORAGE_KEYS.USER_NAME);
  localStorage.removeItem(STORAGE_KEYS.USER_ROLE);
  localStorage.removeItem(STORAGE_KEYS.GROUU_TOKEN);
};

export const logoutAppConfig = resetAppConfig;