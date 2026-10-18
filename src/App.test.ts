import { describe, it, expect, vi, beforeEach } from "vitest";
import RootLayout from "./routes/+layout.svelte";
import { ssr } from "./routes/+layout";
import RootPage from "./routes/+page.svelte";
import RootError from "./routes/+error.svelte";
import AuthLayout from "./routes/auth/+layout.svelte";
import LoginPageWrapper from "./routes/auth/login/+page.svelte";
import RegisterPageWrapper from "./routes/auth/register/+page.svelte";
import ProfilePageWrapper from "./routes/profile/+page.svelte";
import CourseDetailPageWrapper from "./routes/courses/[courseId]/+page.svelte";
import ContentPageWrapper from "./routes/courses/[courseId]/contents/[contentId]/+page.svelte";
import UsersPageWrapper from "./routes/users/+page.svelte";
import { renderWithProviders } from "./test-utils";
import { updateMockPage } from "./setupTests";
import apiHelper from "./helpers/apiHelper";
import { coursesStore } from "./features/courses/states/coursesStore";
import { usersStore } from "./features/users/states/usersStore";

const logged = { id: 1, name: "Logged User", email: "user@del.org" };
const course: any = {
  id: 1, user_id: 1, title: "Detail Test", description: "Desc", students: [], contents: [],
  created_at: "2024-01-01T00:00:00Z", updated_at: "2024-01-01T00:00:00Z",
};
const content: any = { id: 2, title: "Materi Test", youtube: "https://youtu.be/dQw4w9WgXcQ", status: 0 };

// Pola heading yang diaudit axe: tepat satu h1 dan level heading naik satu per satu.
function expectSequentialHeadings(container: Element) {
  const levels = [...container.querySelectorAll("h1,h2,h3,h4,h5,h6")].map((h) => Number(h.tagName[1]));
  expect(levels[0]).toBe(1);
  levels.slice(1).forEach((level, i) => expect(level - levels[i]).toBeLessThanOrEqual(1));
}

describe("SvelteKit Routes and Layouts", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    updateMockPage({
      url: new URL("http://localhost/"),
      params: { courseId: "1", contentId: "2" },
      route: { id: "/" },
      status: 200,
      error: null,
      data: {},
      form: null,
    });
    // Tidak ada pemanggilan API sungguhan dari test rute.
    vi.spyOn(usersStore, "asyncSetProfile").mockImplementation(() => Promise.resolve());
    vi.spyOn(usersStore, "asyncSetUsers").mockImplementation(() => Promise.resolve());
    vi.spyOn(coursesStore, "asyncSetCourses").mockImplementation(async () => {});
    vi.spyOn(coursesStore, "asyncSetCourse").mockImplementation(async () => {});
    vi.spyOn(coursesStore, "asyncSetContent").mockImplementation(async () => {});
  });

  it("should verify ssr is true in +layout.ts", () => {
    expect(ssr).toBe(true);
  });

  it("should render RootLayout for a non-auth route using CourseLayout", () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("valid-token");
    const { wrapper } = renderWithProviders(RootLayout, { preloadedState: { profile: logged } });
    expect(wrapper.text()).toContain("Delcom Courses");
    expect(wrapper.findAll("main").length).toBe(1);
  });

  it("should render RootLayout for an /auth route directly", () => {
    const { wrapper } = renderWithProviders(RootLayout, { route: "/auth/login" });
    expect(wrapper.text()).not.toContain("Delcom Courses");
  });

  it("should dynamically switch layout between non-auth and auth routes on navigation", async () => {
    vi.spyOn(apiHelper, "getAccessToken").mockReturnValue("valid-token");
    const { wrapper } = renderWithProviders(RootLayout, { route: "/", preloadedState: { profile: logged } });
    expect(wrapper.text()).toContain("Delcom Courses");

    updateMockPage({ url: new URL("http://localhost:3000/auth/login") });
    await new Promise((r) => setTimeout(r, 0));
    expect(wrapper.text()).not.toContain("Delcom Courses");

    updateMockPage({ url: new URL("http://localhost:3000/") });
    await new Promise((r) => setTimeout(r, 0));
    expect(wrapper.text()).toContain("Delcom Courses");
  });

  it("should render RootPage (+page.svelte) with the course list", () => {
    const { wrapper } = renderWithProviders(RootPage, { preloadedState: { profile: logged, courses: [] } });
    expect(wrapper.text()).toContain("Daftar Kursus");
    expectSequentialHeadings(wrapper.element!.parentElement as Element);
  });

  it("should render RootError (+error.svelte) as the not-found page", () => {
    const { wrapper } = renderWithProviders(RootError);
    expect(wrapper.text()).toContain("404");
    expect(wrapper.text()).toContain("Halaman Tidak Ditemukan");
    expect(wrapper.findAll("main").length).toBe(0);
    expectSequentialHeadings(wrapper.element!.parentElement as Element);
  });

  it("should render AuthLayout (routes/auth/+layout.svelte) with one main and one h1", () => {
    const { wrapper } = renderWithProviders(AuthLayout);
    expect(wrapper.text()).toContain("Delcom Courses");
    expect(wrapper.text()).toContain("kursus");
    expect(wrapper.findAll("main").length).toBe(1);
    expect(wrapper.findAll("h1").length).toBe(1);
  });

  it("should render LoginPageWrapper (routes/auth/login/+page.svelte)", () => {
    const { wrapper } = renderWithProviders(LoginPageWrapper);
    expect(wrapper.text()).toContain("Masuk Sekarang");
  });

  it("should render RegisterPageWrapper (routes/auth/register/+page.svelte)", () => {
    const { wrapper } = renderWithProviders(RegisterPageWrapper);
    expect(wrapper.text()).toContain("Daftar Sekarang");
  });

  it("should render ProfilePageWrapper (routes/profile/+page.svelte)", () => {
    const { wrapper } = renderWithProviders(ProfilePageWrapper, { preloadedState: { profile: logged } });
    expect(wrapper.text()).toContain("Profil Akun");
    expectSequentialHeadings(wrapper.element!.parentElement as Element);
  });

  it("should render CourseDetailPageWrapper (routes/courses/[courseId]/+page.svelte)", () => {
    const { wrapper } = renderWithProviders(CourseDetailPageWrapper, {
      params: { courseId: "1" },
      preloadedState: { profile: logged, course },
    });
    expect(wrapper.text()).toContain("Detail Test");
    expect(coursesStore.asyncSetCourse).toHaveBeenCalledWith("1");
    expectSequentialHeadings(wrapper.element!.parentElement as Element);
  });

  it("should render ContentPageWrapper (routes/courses/[courseId]/contents/[contentId]/+page.svelte)", () => {
    const { wrapper } = renderWithProviders(ContentPageWrapper, {
      params: { courseId: "1", contentId: "2" },
      preloadedState: { profile: logged, course, content },
    });
    expect(wrapper.text()).toContain("Materi Test");
    expect(coursesStore.asyncSetCourse).toHaveBeenCalledWith("1");
    expect(coursesStore.asyncSetContent).toHaveBeenCalledWith("2");
    expectSequentialHeadings(wrapper.element!.parentElement as Element);
  });

  it("should render UsersPageWrapper (routes/users/+page.svelte)", () => {
    const { wrapper } = renderWithProviders(UsersPageWrapper, {
      preloadedState: { users: [{ id: 1, name: "User Satu", email: "satu@del.org" }] },
    });
    expect(wrapper.text()).toContain("Semua Pengguna");
    expectSequentialHeadings(wrapper.element!.parentElement as Element);
  });
});
