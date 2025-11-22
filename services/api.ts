import { AppItem, DocumentItem } from '../types';

interface StorageData {
  apps: AppItem[];
  documents: DocumentItem[];
}

export const api = {
  async loadData(): Promise<StorageData | null> {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) {
        // If we are in dev mode without the server proxy, this might fail (404).
        // In production (Docker), this routes to server.js
        console.warn('API not accessible, falling back to localStorage logic in App');
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to load data from server:", error);
      return null;
    }
  },

  async saveData(apps: AppItem[], documents: DocumentItem[]): Promise<boolean> {
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apps, documents }),
      });
      return response.ok;
    } catch (error) {
      console.error("Failed to save data to server:", error);
      return false;
    }
  }
};