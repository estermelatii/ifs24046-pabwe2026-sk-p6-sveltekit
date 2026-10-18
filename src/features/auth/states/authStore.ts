import { writable } from "svelte/store";
import authApi from "../api/authApi";
import apiHelper from "../../../helpers/apiHelper";
import { showErrorDialog, showSuccessDialog } from "../../../helpers/toolsHelper";

export interface AuthState {
  isAuthLogin: boolean;
  isAuthRegister: boolean;
  isAuthLogout: boolean;
}

function createAuthStore() {
  const initial: AuthState = {
    isAuthLogin: false,
    isAuthRegister: false,
    isAuthLogout: false,
  };

  let currentState: AuthState = { ...initial };
  const innerStore = writable<AuthState>(currentState);
  innerStore.subscribe((val) => {
    currentState = val;
  });

  return {
    subscribe: innerStore.subscribe,
    get isAuthLogin() {
      return currentState.isAuthLogin;
    },
    get isAuthRegister() {
      return currentState.isAuthRegister;
    },
    get isAuthLogout() {
      return currentState.isAuthLogout;
    },
    get $state() {
      return currentState;
    },
    reset(state: Partial<AuthState> = initial) {
      innerStore.set({ ...initial, ...state });
    },
    setIsAuthLogin(value: boolean) {
      innerStore.update((s) => ({ ...s, isAuthLogin: value }));
    },
    setIsAuthRegister(value: boolean) {
      innerStore.update((s) => ({ ...s, isAuthRegister: value }));
    },
    setIsAuthLogout(value: boolean) {
      innerStore.update((s) => ({ ...s, isAuthLogout: value }));
    },
    async asyncSetIsAuthLogin(email: string, password: string) {
      try {
        const data = await authApi.postLogin(email, password);
        apiHelper.putAccessToken(data.token);
        this.setIsAuthLogin(true);
      } catch (error: any) {
        this.setIsAuthLogin(false);
        showErrorDialog(error.message);
      }
    },
    async asyncSetIsAuthRegister(name: string, email: string, password: string) {
      try {
        const message = await authApi.postRegister(name, email, password);
        this.setIsAuthRegister(true);
        showSuccessDialog(message);
      } catch (error: any) {
        this.setIsAuthRegister(false);
        showErrorDialog(error.message);
      }
    },
    async asyncSetIsAuthLogout() {
      try {
        await authApi.postLogout();
      } catch {
        // Still proceed with clearing token locally even if server error
      } finally {
        apiHelper.putAccessToken("");
        this.setIsAuthLogout(true);
      }
    },
  };
}

export const authStore = createAuthStore();
export const useAuthStore = () => authStore;
export default authStore;
