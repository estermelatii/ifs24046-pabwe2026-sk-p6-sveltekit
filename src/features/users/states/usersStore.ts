import { writable } from "svelte/store";
import userApi, { type User } from "../api/userApi";
import { showErrorDialog, showSuccessDialog } from "../../../helpers/toolsHelper";

export interface UsersState {
  users: User[];
  user: User | null;
  profile: User | null;
  isProfile: boolean;
  isChangeProfile: boolean;
  isChangeProfilePhoto: boolean;
  isChangeProfilePassword: boolean;
}

function createUsersStore() {
  const initial: UsersState = {
    users: [],
    user: null,
    profile: null,
    isProfile: false,
    isChangeProfile: false,
    isChangeProfilePhoto: false,
    isChangeProfilePassword: false,
  };

  let currentState: UsersState = { ...initial };
  const innerStore = writable<UsersState>(currentState);
  innerStore.subscribe((val) => {
    currentState = val;
  });

  return {
    subscribe: innerStore.subscribe,
    get users() {
      return currentState.users;
    },
    get user() {
      return currentState.user;
    },
    get profile() {
      return currentState.profile;
    },
    get isProfile() {
      return currentState.isProfile;
    },
    get isChangeProfile() {
      return currentState.isChangeProfile;
    },
    get isChangeProfilePhoto() {
      return currentState.isChangeProfilePhoto;
    },
    get isChangeProfilePassword() {
      return currentState.isChangeProfilePassword;
    },
    get $state() {
      return currentState;
    },
    reset(state: Partial<UsersState> = initial) {
      innerStore.set({ ...initial, ...state });
    },
    setUsers(users: User[]) {
      innerStore.update((s) => ({ ...s, users }));
    },
    setUser(user: User | null) {
      innerStore.update((s) => ({ ...s, user }));
    },
    setProfile(profile: User | null) {
      innerStore.update((s) => ({ ...s, profile }));
    },
    setIsProfile(status: boolean) {
      innerStore.update((s) => ({ ...s, isProfile: status }));
    },
    setIsChangeProfile(status: boolean) {
      innerStore.update((s) => ({ ...s, isChangeProfile: status }));
    },
    setIsChangeProfilePhoto(status: boolean) {
      innerStore.update((s) => ({ ...s, isChangeProfilePhoto: status }));
    },
    setIsChangeProfilePassword(status: boolean) {
      innerStore.update((s) => ({ ...s, isChangeProfilePassword: status }));
    },
    async asyncSetUsers() {
      try {
        const users = await userApi.getUsers();
        this.setUsers(users);
      } catch {
        this.setUsers([]);
      }
    },
    async asyncSetUserById(userId: string | number) {
      try {
        const user = await userApi.getUserById(userId);
        this.setUser(user);
      } catch {
        this.setUser(null);
      }
    },
    async asyncSetProfile() {
      try {
        const profile = await userApi.getProfile();
        this.setProfile(profile);
      } catch {
        this.setProfile(null);
      } finally {
        this.setIsProfile(true);
      }
    },
    async asyncPutProfile(name: string, email: string) {
      try {
        const profile = await userApi.putProfile(name, email);
        this.setProfile(profile);
        showSuccessDialog("Profil berhasil diperbarui!");
        this.setIsChangeProfile(true);
      } catch (error: any) {
        showErrorDialog(error.message);
        this.setIsChangeProfile(false);
      }
    },
    async asyncPostProfilePhoto(photo: File) {
      try {
        const message = await userApi.postProfilePhoto(photo);
        showSuccessDialog(message || "Foto profil berhasil diperbarui!");
        const profile = await userApi.getProfile();
        this.setProfile(profile);
        this.setIsChangeProfilePhoto(true);
      } catch (error: any) {
        showErrorDialog(error.message);
        this.setIsChangeProfilePhoto(false);
      }
    },
    async asyncPutProfilePassword(oldPassword: string, newPassword: string, newPasswordConfirmation?: string) {
      try {
        const message = await userApi.putProfilePassword(oldPassword, newPassword, newPasswordConfirmation);
        showSuccessDialog(message || "Kata sandi berhasil diperbarui!");
        this.setIsChangeProfilePassword(true);
      } catch (error: any) {
        showErrorDialog(error.message);
        this.setIsChangeProfilePassword(false);
      }
    },
  };
}

export const usersStore = createUsersStore();
export const useUsersStore = () => usersStore;
export default usersStore;
