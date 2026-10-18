import { describe, it, expect, vi, beforeEach } from "vitest";
import CourseLayout from "./CourseLayout.svelte";
import { renderWithProviders } from "../../../test-utils";
import apiHelper from "../../../helpers/apiHelper";
import { usersStore } from "../../users/states/usersStore";

const tick = () => new Promise((r) => setTimeout(r, 10));

describe("CourseLayout", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Tanpa mock ini store memanggil API sungguhan dan hasilnya bergantung pada jaringan.
    vi.spyOn(usersStore, "asyncSetProfile").mockImplementation(() => Promise.resolve());
  });

  it("should redirect to login if the access token does not exist", async () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue(null);
    const { wrapper, mockGoto } = renderWithProviders(CourseLayout, { preloadedState: { profile: null } });
    await tick();

    expect(mockGoto).toHaveBeenCalledWith("/auth/login");
    expect(usersStore.asyncSetProfile).not.toHaveBeenCalled();
    expect(wrapper.text()).toContain("Memuat sesi pengguna...");
  });

  it("should expose a main landmark and an h1 while loading the session", () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("valid-token");
    const { wrapper } = renderWithProviders(CourseLayout, { preloadedState: { profile: null } });

    expect(wrapper.findAll("main").length).toBe(1);
    expect(wrapper.find("main h1").text()).toBe("Delcom Courses");
  });

  it("should load the profile when a token exists", () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("valid-token");
    renderWithProviders(CourseLayout, { preloadedState: { profile: null } });
    expect(usersStore.asyncSetProfile).toHaveBeenCalled();
  });

  it("should render navbar and sidebar, toggle the sidebar once per click, and log out once", async () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("valid-token");
    const { wrapper, authStore } = renderWithProviders(CourseLayout, {
      preloadedState: { profile: { id: 1, name: "Test User", email: "test@delcom.org" } },
    });
    const logoutSpy = vi.spyOn(authStore, "asyncSetIsAuthLogout").mockImplementation(() => Promise.resolve());

    expect(wrapper.text()).toContain("Delcom Courses");
    expect(wrapper.text()).toContain("Semua Kursus");
    expect(wrapper.text()).toContain("Test User");
    expect(wrapper.findAll("main").length).toBe(1);

    wrapper.find('[data-testid="toggle-sidebar-btn"]').element.click();
    await tick();
    expect(wrapper.find('[data-testid="sidebar-backdrop"]').exists()).toBe(true);

    wrapper.find('[data-testid="sidebar-backdrop"]').element.click();
    await tick();
    expect(wrapper.find('[data-testid="sidebar-backdrop"]').exists()).toBe(false);

    wrapper.find('[data-testid="profile-dropdown-button"]').element.click();
    await tick();
    wrapper.find('[data-testid="dropdown-logout-button"]').element.click();
    await tick();

    expect(logoutSpy).toHaveBeenCalledTimes(1);
  });

  it("should stay on the page when isProfile fires and the profile exists", async () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("valid-token");
    const putTokenSpy = vi.spyOn(apiHelper, "putAccessToken").mockImplementation(() => {});
    const { wrapper, mockGoto } = renderWithProviders(CourseLayout, {
      preloadedState: { profile: { id: 1, name: "Logged User" }, isProfile: false },
    });
    mockGoto.mockClear();

    usersStore.setIsProfile(true);
    await tick();

    expect(wrapper.text()).toContain("Logged User");
    expect(putTokenSpy).not.toHaveBeenCalled();
    expect(mockGoto).not.toHaveBeenCalled();
  });

  it("should clear the token and redirect when isProfile fires without a profile", async () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("valid-token");
    const putTokenSpy = vi.spyOn(apiHelper, "putAccessToken").mockImplementation(() => {});
    const { mockGoto } = renderWithProviders(CourseLayout, { preloadedState: { profile: null, isProfile: false } });

    usersStore.setIsProfile(true);
    await tick();

    expect(putTokenSpy).toHaveBeenCalledWith("");
    expect(mockGoto).toHaveBeenCalledWith("/auth/login");
  });

  it("should clear the profile and redirect to login after logout completes", async () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("valid-token");
    const { authStore, mockGoto } = renderWithProviders(CourseLayout, {
      preloadedState: { profile: { id: 1, name: "Logged User" }, isAuthLogout: false },
    });
    mockGoto.mockClear();

    authStore.setIsAuthLogout(true);
    await tick();

    expect(mockGoto).toHaveBeenCalledWith("/auth/login");
    expect(usersStore.$state.profile).toBeNull();
  });
});
