import { writable } from 'svelte/store';

export type SnackbarType = 'success' | 'error' | 'warning' | 'info';

export interface SnackbarMessage {
  id: number;
  type: SnackbarType;
  message: string;
}

function createSnackbarStore() {
  const { subscribe, update } = writable<SnackbarMessage[]>([]);

  return {
    subscribe,
    push(type: SnackbarType, message: string): void {
      const id = Date.now();

      update((messages) => [...messages, { id, type, message }]);

      setTimeout(() => {
        update((messages) => messages.filter((item) => item.id !== id));
      }, 4000);
    },
    remove(id: number): void {
      update((messages) => messages.filter((item) => item.id !== id));
    }
  };
}

export const snackbar = createSnackbarStore();
