import { describe, it, expect, vi, beforeEach } from "vitest";
import HomePage from "./HomePage.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";
import store from "../states/coursesStore";
import courseApi from "../api/courseApi";

const tick = () => new Promise((r) => setTimeout(r, 10));

const profile = { id: 1, name: "Saya", email: "saya@del.org" };
const courses: any[] = [
  { id: 1, user_id: 1, title: "Web Lanjut", description: "Belajar web", cover: "http://x/c.png", students: [2, 3], ratings: [{ user_id: 2, rating: 5 }, { user_id: 3, rating: 4 }] },
  { id: 2, user_id: 2, title: "Basis Data", description: "", students: [{ id: 1 }] },
  { id: 3, user_id: 2, title: "Jaringan", description: "Dasar jaringan" },
  { id: 4, user_id: 2, title: null, description: null },
];

function setup(state: Record<string, any> = {}) {
  return renderWithProviders(HomePage, { preloadedState: { profile, courses, ...state } });
}

describe("HomePage", () => {
  let loadSpy: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(toolsHelper, "showErrorDialog").mockResolvedValue(undefined as any);
    // Jangan pernah memanggil API sungguhan dari test halaman.
    loadSpy = vi.spyOn(store, "asyncSetCourses").mockImplementation(async () => {});
  });

  it("should render nothing without a profile", () => {
    const { wrapper } = renderWithProviders(HomePage, { preloadedState: { profile: null } });
    expect(wrapper.text().trim()).toBe("");
  });

  describe("with data", () => {
    let utils: any;

    beforeEach(async () => {
      utils = setup();
      await tick();
    });

    it("should load courses on mount", () => {
      expect(loadSpy).toHaveBeenCalledTimes(1);
    });

    it("should render one h1 and an h2 per course card", () => {
      const { wrapper } = utils;
      expect(wrapper.findAll("h1").length).toBe(1);
      expect(wrapper.find("h1").text()).toBe("Daftar Kursus");
      expect(wrapper.findAll("h2").length).toBe(4);
      expect(wrapper.find("main").exists()).toBe(false);
    });

    it("should render cards with links, cover, student count, and rating", () => {
      const { wrapper } = utils;
      const card1 = wrapper.find('[data-testid="course-card-1"]');
      expect(card1.text()).toContain("Web Lanjut");
      expect(card1.text()).toContain("2 peserta");
      expect(card1.text()).toContain("4.5");
      expect(card1.find("img").exists()).toBe(true);
      expect(wrapper.find('[data-testid="view-course-1"]').attributes("href")).toBe("/courses/1");

      const card3 = wrapper.find('[data-testid="course-card-3"]');
      expect(card3.text()).toContain("0 peserta");
      expect(card3.text()).toContain("Belum ada rating");
      expect(card3.find("img").exists()).toBe(false);
    });

    it("should show role badges for owner and student only", () => {
      const { wrapper } = utils;
      expect(wrapper.find('[data-testid="course-card-1"]').text()).toContain("Milik Saya");
      expect(wrapper.find('[data-testid="course-card-2"]').text()).toContain("Terdaftar");
      const guest = wrapper.find('[data-testid="course-card-3"]').text();
      expect(guest).not.toContain("Milik Saya");
      expect(guest).not.toContain("Terdaftar");
    });

    it("should show edit and delete buttons only on owned courses", () => {
      const { wrapper } = utils;
      expect(wrapper.find('[data-testid="edit-course-1"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="delete-course-1"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="edit-course-2"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="delete-course-3"]').exists()).toBe(false);
    });

    it("should search by title or description, case-insensitively", async () => {
      const { wrapper } = utils;
      const input = wrapper.find('[data-testid="search-course-input"]');

      await input.setValue("BASIS");
      expect(wrapper.find('[data-testid="course-card-2"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="course-card-1"]').exists()).toBe(false);

      await input.setValue("dasar jaringan");
      expect(wrapper.find('[data-testid="course-card-3"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="course-card-2"]').exists()).toBe(false);

      await input.setValue("   ");
      expect(wrapper.findAll('[data-testid^="course-card-"]').length).toBe(4);
    });

    it("should show an empty state when nothing matches", async () => {
      const { wrapper } = utils;
      await wrapper.find('[data-testid="search-course-input"]').setValue("tidak-ada");
      expect(wrapper.text()).toContain("Belum ada kursus yang cocok.");
    });

    it("should filter to my courses and back to all", async () => {
      const { wrapper } = utils;
      wrapper.find('[data-testid="filter-mine-btn"]').element.click();
      await tick();
      expect(wrapper.findAll('[data-testid^="course-card-"]').map((c: any) => c.element.dataset.testid)).toEqual([
        "course-card-1",
      ]);
      expect(wrapper.find('[data-testid="filter-mine-btn"]').attributes("aria-pressed")).toBe("true");

      wrapper.find('[data-testid="filter-all-btn"]').element.click();
      await tick();
      expect(wrapper.findAll('[data-testid^="course-card-"]').length).toBe(4);
    });

    it("should open and close the add modal", async () => {
      const { wrapper } = utils;
      wrapper.find('[data-testid="add-course-btn"]').element.click();
      await tick();
      expect(wrapper.find('[data-testid="add-course-modal"]').exists()).toBe(true);

      wrapper.find('[data-testid="close-add-modal-btn"]').element.click();
      await tick();
      expect(wrapper.find('[data-testid="add-course-modal"]').exists()).toBe(false);
    });

    it("should open the change modal for the selected course and close it", async () => {
      const { wrapper } = utils;
      vi.spyOn(courseApi, "getCourseById").mockResolvedValue({ id: 1, title: "Web", description: "d" } as any);

      wrapper.find('[data-testid="edit-course-1"]').element.click();
      await tick();
      expect(wrapper.find('[data-testid="edit-course-modal"]').exists()).toBe(true);
      expect(courseApi.getCourseById).toHaveBeenCalledWith(1);

      wrapper.find('[data-testid="close-edit-modal-btn"]').element.click();
      await tick();
      expect(wrapper.find('[data-testid="edit-course-modal"]').exists()).toBe(false);
    });

    it("should delete one course only after confirmation", async () => {
      const { wrapper, coursesStore } = utils;
      const deleteSpy = vi.spyOn(coursesStore, "asyncSetIsCourseDelete").mockResolvedValue();
      const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");

      confirmSpy.mockResolvedValueOnce({ isConfirmed: false } as any);
      wrapper.find('[data-testid="delete-course-1"]').element.click();
      await tick();
      expect(deleteSpy).not.toHaveBeenCalled();

      confirmSpy.mockResolvedValueOnce({ isConfirmed: true } as any);
      wrapper.find('[data-testid="delete-course-1"]').element.click();
      await tick();
      expect(deleteSpy).toHaveBeenCalledWith(1);
    });

    it("should delete all courses only after confirmation", async () => {
      const { wrapper, coursesStore } = utils;
      const deleteAllSpy = vi.spyOn(coursesStore, "asyncSetIsCourseDeleteAll").mockResolvedValue();
      const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");

      confirmSpy.mockResolvedValueOnce({ isConfirmed: false } as any);
      wrapper.find('[data-testid="delete-all-btn"]').element.click();
      await tick();
      expect(deleteAllSpy).not.toHaveBeenCalled();

      confirmSpy.mockResolvedValueOnce({ isConfirmed: true } as any);
      wrapper.find('[data-testid="delete-all-btn"]').element.click();
      await tick();
      expect(deleteAllSpy).toHaveBeenCalledTimes(1);
    });

    it("should reload the list after a single delete and after deleting all", async () => {
      loadSpy.mockClear();
      utils.coursesStore.setIsCourseDeleted(true);
      await tick();
      expect(loadSpy).toHaveBeenCalledTimes(1);
      expect(utils.coursesStore.$state.isCourseDeleted).toBe(false);

      utils.coursesStore.setIsCourseDeletedAll(true);
      await tick();
      expect(loadSpy).toHaveBeenCalledTimes(2);
      expect(utils.coursesStore.$state.isCourseDeletedAll).toBe(false);
    });
  });

  it("should hide the delete-all button when the user owns no course", async () => {
    const { wrapper } = setup({ courses: [courses[1]] });
    await tick();
    expect(wrapper.find('[data-testid="delete-all-btn"]').exists()).toBe(false);
  });

  it("should show a loading state while the list is loading and empty", async () => {
    let finish: () => void = () => {};
    loadSpy.mockReturnValue(new Promise<void>((r) => (finish = r)));
    const { wrapper } = setup({ courses: [] });
    await tick();
    expect(wrapper.text()).toContain("Memuat daftar kursus...");

    finish();
    await tick();
    expect(wrapper.text()).not.toContain("Memuat daftar kursus...");
    expect(wrapper.text()).toContain("Belum ada kursus yang cocok.");
  });

  it("should treat a null course list as empty", async () => {
    const { wrapper, coursesStore } = setup();
    await tick();
    coursesStore.setCourses(null as any);
    await tick();
    expect(wrapper.text()).toContain("Belum ada kursus yang cocok.");
  });

  it("should not match the 'mine' filter when the profile id differs", async () => {
    const { wrapper } = setup({ profile: { id: 99, name: "Lain" } });
    await tick();
    wrapper.find('[data-testid="filter-mine-btn"]').element.click();
    await tick();
    expect(wrapper.text()).toContain("Belum ada kursus yang cocok.");
  });
});
