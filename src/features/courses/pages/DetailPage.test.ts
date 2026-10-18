import { describe, it, expect, vi, beforeEach } from "vitest";
import DetailPage from "./DetailPage.svelte";
import { renderWithProviders } from "../../../test-utils";
import courseApi from "../api/courseApi";
import * as toolsHelper from "../../../helpers/toolsHelper";
import { coursesStore as store } from "../states/coursesStore";

const tick = () => new Promise((r) => setTimeout(r, 10));

const profile = { id: 1, name: "Saya" };
const contents = [
  { id: 11, title: "Pengenalan", youtube: "https://youtu.be/dQw4w9WgXcQ", status: 1 },
  { id: 12, title: "Lanjutan", youtube: "https://youtu.be/abcdefghijk", status: 0 },
];
const baseCourse: any = {
  id: 5,
  user_id: 1,
  title: "Web Lanjut",
  description: "Baris satu\nBaris dua",
  cover: "http://x/cover.png",
  students: [2, { id: 3, name: "Budi" }],
  ratings: [{ user_id: 2, rating: 5 }, { user_id: 1, rating: 4 }],
  contents,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-02T00:00:00Z",
};
const asOwner = () => ({ ...baseCourse });
const asStudent = () => ({ ...baseCourse, user_id: 9, students: [1, 2] });
const asGuest = () => ({ ...baseCourse, user_id: 9, students: [2] });

function setup(course: any = asOwner(), props: Record<string, any> = { courseId: "5" }, state: Record<string, any> = {}) {
  return renderWithProviders(DetailPage, { props, preloadedState: { profile, course, ...state } });
}

describe("DetailPage", () => {
  let loadSpy: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    loadSpy = vi.spyOn(store, "asyncSetCourse").mockImplementation(async () => {});
    vi.spyOn(toolsHelper, "showErrorDialog").mockResolvedValue(undefined as any);
  });

  it("should show a spinner with a hidden h1 without profile or course", () => {
    const a = setup(asOwner(), { courseId: "5" }, { profile: null });
    expect(a.wrapper.find(".animate-spin").exists()).toBe(true);
    expect(a.wrapper.find("h1").text()).toBe("Memuat detail kursus");

    const b = setup(null);
    expect(b.wrapper.find("h1").text()).toBe("Memuat detail kursus");
  });

  it("should load the course on mount, but not without an id", () => {
    setup();
    expect(loadSpy).toHaveBeenCalledWith("5");

    loadSpy.mockClear();
    setup(asOwner(), { courseId: undefined });
    expect(loadSpy).not.toHaveBeenCalled();
  });

  it("should reload when the id prop changes", async () => {
    const { rerender } = setup();
    loadSpy.mockClear();
    await rerender({ courseId: "6" });
    await tick();
    expect(loadSpy).toHaveBeenCalledWith("6");
  });

  it("should render detail, cover, stats, and one h1 with sequential headings", () => {
    const { wrapper } = setup();
    expect(wrapper.findAll("h1").length).toBe(1);
    expect(wrapper.find("h1").text()).toContain("Web Lanjut");
    expect(wrapper.text()).toContain("#5");
    expect(wrapper.find('[data-testid="student-count"]').text()).toBe("2");
    expect(wrapper.find('[data-testid="average-rating"]').text()).toBe("4.5");
    expect(wrapper.find("img").exists()).toBe(true);
    expect(wrapper.find('[data-testid="course-detail-description"]').text()).toContain("Baris satu");
    expect(wrapper.findAll("h2").length).toBeGreaterThan(0);
    expect(wrapper.find("main").exists()).toBe(false);
  });

  it("should render without cover, description, ratings, and contents", () => {
    const { wrapper } = setup({ id: 5, user_id: 1, title: "Kosong" });
    expect(wrapper.find("img").exists()).toBe(false);
    expect(wrapper.text()).toContain("Tidak ada deskripsi");
    expect(wrapper.find('[data-testid="average-rating"]').text()).toBe("Belum ada rating");
    expect(wrapper.find('[data-testid="contents-empty"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="students-section"]').text()).toContain("Belum ada peserta");
  });

  it("should link back to the course list", () => {
    const { wrapper } = setup();
    expect(wrapper.find('[data-testid="back-to-courses-link"]').attributes("href")).toBe("/");
  });

  describe("owner", () => {
    it("should show owner actions, participants, and content management", () => {
      const { wrapper } = setup();
      expect(wrapper.find('[data-testid="role-badge"]').text().trim()).toBe("Pemilik");
      expect(wrapper.find('[data-testid="edit-cover-btn"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="edit-detail-course-btn"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="delete-detail-course-btn"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="add-content-btn"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="join-course-btn"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="leave-course-btn"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="star-rating"]').exists()).toBe(false);

      const students = wrapper.find('[data-testid="students-section"]').text();
      expect(students).toContain("Peserta #2");
      expect(students).toContain("Budi");
      expect(wrapper.find('[data-testid="edit-content-11"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="delete-content-12"]').exists()).toBe(true);
    });

    it("should take precedence over the student role when both apply", () => {
      const { wrapper } = setup({ ...asOwner(), students: [1] });
      expect(wrapper.find('[data-testid="role-badge"]').text().trim()).toBe("Pemilik");
      expect(wrapper.find('[data-testid="leave-course-btn"]').exists()).toBe(false);
    });

    it("should open and close the cover and edit modals", async () => {
      vi.spyOn(courseApi, "getCourseById").mockResolvedValue(asOwner());
      const { wrapper } = setup();

      wrapper.find('[data-testid="edit-cover-btn"]').element.click();
      await tick();
      expect(wrapper.find('[data-testid="change-cover-modal"]').exists()).toBe(true);
      wrapper.find('[data-testid="close-cover-modal-btn"]').element.click();
      await tick();
      expect(wrapper.find('[data-testid="change-cover-modal"]').exists()).toBe(false);

      wrapper.find('[data-testid="edit-detail-course-btn"]').element.click();
      await tick();
      expect(wrapper.find('[data-testid="edit-course-modal"]').exists()).toBe(true);
      wrapper.find('[data-testid="close-edit-modal-btn"]').element.click();
      await tick();
      expect(wrapper.find('[data-testid="edit-course-modal"]').exists()).toBe(false);
    });

    it("should open the content modal in add mode, then edit mode, then add mode again", async () => {
      const { wrapper } = setup();

      wrapper.find('[data-testid="add-content-btn"]').element.click();
      await tick();
      expect(wrapper.find('[data-testid="content-modal-title"]').text().trim()).toBe("Tambah Konten");
      wrapper.find('[data-testid="close-content-modal-btn"]').element.click();
      await tick();

      wrapper.find('[data-testid="edit-content-12"]').element.click();
      await tick();
      expect(wrapper.find('[data-testid="content-modal-title"]').text().trim()).toBe("Ubah Konten");
      expect(wrapper.find('[data-testid="content-title-input"]').element.value).toBe("Lanjutan");
      wrapper.find('[data-testid="close-content-modal-btn"]').element.click();
      await tick();

      wrapper.find('[data-testid="add-content-btn"]').element.click();
      await tick();
      expect(wrapper.find('[data-testid="content-modal-title"]').text().trim()).toBe("Tambah Konten");
    });

    it("should delete the course after confirmation and navigate home when deleted", async () => {
      const { wrapper, coursesStore, mockGoto } = setup();
      const deleteSpy = vi.spyOn(coursesStore, "asyncSetIsCourseDelete").mockResolvedValue();
      const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");

      confirmSpy.mockResolvedValueOnce({ isConfirmed: false } as any);
      wrapper.find('[data-testid="delete-detail-course-btn"]').element.click();
      await tick();
      expect(deleteSpy).not.toHaveBeenCalled();

      confirmSpy.mockResolvedValueOnce({ isConfirmed: true } as any);
      wrapper.find('[data-testid="delete-detail-course-btn"]').element.click();
      await tick();
      expect(deleteSpy).toHaveBeenCalledWith(5);

      mockGoto.mockClear();
      coursesStore.setIsCourseDeleted(true);
      await tick();
      expect(mockGoto).toHaveBeenCalledWith("/");
      expect(coursesStore.$state.isCourseDeleted).toBe(false);
    });

    it("should not delete when confirmed but the course has disappeared", async () => {
      const { wrapper, coursesStore } = setup();
      const deleteSpy = vi.spyOn(coursesStore, "asyncSetIsCourseDelete").mockResolvedValue();
      vi.spyOn(toolsHelper, "showConfirmDialog").mockImplementation(async () => {
        coursesStore.setCourse(null);
        return { isConfirmed: true } as any;
      });

      wrapper.find('[data-testid="delete-detail-course-btn"]').element.click();
      await tick();
      expect(deleteSpy).not.toHaveBeenCalled();
    });

    it("should delete a content only after confirmation, then reload the course", async () => {
      const { wrapper, coursesStore } = setup();
      const deleteSpy = vi.spyOn(coursesStore, "asyncSetIsContentDelete").mockResolvedValue();
      const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");

      confirmSpy.mockResolvedValueOnce({ isConfirmed: false } as any);
      wrapper.find('[data-testid="delete-content-11"]').element.click();
      await tick();
      expect(deleteSpy).not.toHaveBeenCalled();

      confirmSpy.mockResolvedValueOnce({ isConfirmed: true } as any);
      wrapper.find('[data-testid="delete-content-11"]').element.click();
      await tick();
      expect(deleteSpy).toHaveBeenCalledWith("5", 11);

      loadSpy.mockClear();
      coursesStore.setIsContentDeleted(true);
      await tick();
      expect(loadSpy).toHaveBeenCalledWith("5");
      expect(coursesStore.$state.isContentDeleted).toBe(false);
    });
  });

  describe("student", () => {
    it("should show leave, rating, and read-only content", () => {
      const { wrapper } = setup(asStudent());
      expect(wrapper.find('[data-testid="role-badge"]').text().trim()).toBe("Peserta");
      expect(wrapper.find('[data-testid="leave-course-btn"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="star-rating"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="edit-cover-btn"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="add-content-btn"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="students-section"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="edit-content-11"]').exists()).toBe(false);
    });

    it("should mark learned contents and link each to its page", () => {
      const { wrapper } = setup(asStudent());
      expect(wrapper.find('[data-testid="learned-badge-11"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="learned-badge-12"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="open-content-11"]').attributes("href")).toBe("/courses/5/contents/11");
    });

    it("should show the student's own rating on the stars", () => {
      const { wrapper } = setup({ ...asStudent(), ratings: [{ user_id: 2, rating: 5 }] });
      const pressed = wrapper.findAll('[data-testid="star-rating"] button').map((b: any) => b.attributes("aria-pressed"));
      expect(pressed).toEqual(["false", "false", "false", "false", "false"]);

      const rated = setup({ ...asStudent(), ratings: [{ user_id: 1, rating: 3 }] });
      const ratedPressed = rated.wrapper
        .findAll('[data-testid="star-rating"] button')
        .map((b: any) => b.attributes("aria-pressed"));
      expect(ratedPressed).toEqual(["true", "true", "true", "false", "false"]);
    });

    it("should rate the course, then reload it when rated", async () => {
      const { wrapper, coursesStore } = setup(asStudent());
      const rateSpy = vi.spyOn(coursesStore, "asyncSetIsRatingChange").mockResolvedValue();

      wrapper.find('[data-testid="star-4"]').element.click();
      await tick();
      expect(rateSpy).toHaveBeenCalledWith("5", 4);

      loadSpy.mockClear();
      coursesStore.setIsRatingChange(true);
      coursesStore.setIsRatingChanged(true);
      await tick();
      expect(loadSpy).toHaveBeenCalledWith("5");
      expect(coursesStore.$state.isRatingChanged).toBe(false);
    });

    it("should not reload when rating fails", async () => {
      const { coursesStore } = setup(asStudent());
      loadSpy.mockClear();
      coursesStore.setIsRatingChange(true);
      await tick();
      expect(loadSpy).not.toHaveBeenCalled();
    });

    it("should leave the course only after confirmation, then reload", async () => {
      const { wrapper, coursesStore } = setup(asStudent());
      const leaveSpy = vi.spyOn(coursesStore, "asyncSetIsStudentLeave").mockResolvedValue();
      const confirmSpy = vi.spyOn(toolsHelper, "showConfirmDialog");

      confirmSpy.mockResolvedValueOnce({ isConfirmed: false } as any);
      wrapper.find('[data-testid="leave-course-btn"]').element.click();
      await tick();
      expect(leaveSpy).not.toHaveBeenCalled();

      confirmSpy.mockResolvedValueOnce({ isConfirmed: true } as any);
      wrapper.find('[data-testid="leave-course-btn"]').element.click();
      await tick();
      expect(leaveSpy).toHaveBeenCalledWith("5");

      loadSpy.mockClear();
      coursesStore.setIsStudentLeave(true);
      coursesStore.setIsStudentLeft(true);
      await tick();
      expect(loadSpy).toHaveBeenCalledWith("5");
    });
  });

  describe("guest", () => {
    it("should offer joining and lock the contents", () => {
      const { wrapper } = setup(asGuest());
      expect(wrapper.find('[data-testid="role-badge"]').text().trim()).toBe("Belum Bergabung");
      expect(wrapper.find('[data-testid="join-course-btn"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="contents-locked"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="open-content-11"]').exists()).toBe(false);
      expect(wrapper.find('[data-testid="star-rating"]').exists()).toBe(false);
    });

    it("should join the course, then reload when joined", async () => {
      const { wrapper, coursesStore } = setup(asGuest());
      const joinSpy = vi.spyOn(coursesStore, "asyncSetIsStudentJoin").mockResolvedValue();

      wrapper.find('[data-testid="join-course-btn"]').element.click();
      await tick();
      expect(joinSpy).toHaveBeenCalledWith("5");

      loadSpy.mockClear();
      coursesStore.setIsStudentJoin(true);
      coursesStore.setIsStudentJoined(true);
      await tick();
      expect(loadSpy).toHaveBeenCalledWith("5");
      expect(coursesStore.$state.isStudentJoined).toBe(false);
    });
  });

  describe("load results", () => {
    it("should navigate home when loading finishes without a course", async () => {
      const { coursesStore, mockGoto } = setup(null);
      mockGoto.mockClear();
      coursesStore.setIsCourse(true);
      await tick();
      expect(mockGoto).toHaveBeenCalledWith("/");
      expect(coursesStore.$state.isCourse).toBe(false);
    });

    it("should stay when loading finishes with a course", async () => {
      const { coursesStore, mockGoto } = setup();
      mockGoto.mockClear();
      coursesStore.setIsCourse(true);
      await tick();
      expect(mockGoto).not.toHaveBeenCalled();
    });
  });
});
