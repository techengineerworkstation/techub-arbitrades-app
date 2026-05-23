import { createApiClient, type ArbitradesClient } from '@arbitrades/shared';

const DEFAULT_API_URL = 'https://api.arbitrades.sbs';

let client: ArbitradesClient | null = null;
let currentUrl = DEFAULT_API_URL;

export function getApiClient(url?: string): ArbitradesClient {
  if (url && url !== currentUrl) {
    currentUrl = url;
    client = null;
  }
  if (!client) {
    client = createApiClient(currentUrl);
  }
  return client;
}

export function getApiUrl(): string {
  return currentUrl;
}

export function setApiUrl(url: string): void {
  currentUrl = url;
  client = null;
}
