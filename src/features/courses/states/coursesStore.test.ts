import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCoursesStore, coursesStore } from "./coursesStore";
import courseApi from "../api/courseApi";
import * as toolsHelper from "../../../helpers/toolsHelper";

describe("coursesStore", () => {
  beforeEach(() => {
    coursesStore.reset();
    vi.restoreAllMocks();
    vi.spyOn(toolsHelper, "showSuccessDialog").mockResolvedValue(undefined as any);
    vi.spyOn(toolsHelper, "showErrorDialog").mockResolvedValue(undefined as any);
  });

  it("should have the correct default state", () => {
    const state = useCoursesStore().$state;
    expect(state.courses).toEqual([]);
    expect(state.course).toBeNull();
    expect(state.content).toBeNull();
    const flags = Object.entries(state).filter(([k]) => k.startsWith("is"));
    expect(flags.length).toBe(26);
    expect(flags.every(([, v]) => v === false)).toBe(true);
  });

  it("should update state with every setter", () => {
    const store: any = useCoursesStore();
    store.setCourses([{ id: 1 }]);
    store.setCourse({ id: 1 });
    store.setContent({ id: 2 });
    expect(store.$state.courses).toEqual([{ id: 1 }]);
    expect(store.$state.course).toEqual({ id: 1 });
    expect(store.$state.content).toEqual({ id: 2 });

    const flagKeys = Object.keys(store.$state).filter((k) => k.startsWith("is"));
    for (const key of flagKeys) {
      const setter = `set${key.charAt(0).toUpperCase()}${key.slice(1)}`;
      expect(typeof store[setter]).toBe("function");
      store[setter](true);
      expect(store.$state[key]).toBe(true);
    }
  });

  it("should be subscribable and resettable with a partial state", () => {
    const values: any[] = [];
    const unsub = coursesStore.subscribe((v) => values.push(v));
    coursesStore.reset({ courses: [{ id: 9 } as any] });
    unsub();
    expect(values.at(-1).courses).toEqual([{ id: 9 }]);
    expect(values.at(-1).course).toBeNull();
  });

  describe("asyncSetCourses", () => {
    it("should set courses on success and [] on error", async () => {
      vi.spyOn(courseApi, "getCourses").mockResolvedValueOnce([{ id: 1 } as any]);
      await coursesStore.asyncSetCourses();
      expect(coursesStore.$state.courses).toEqual([{ id: 1 }]);

      vi.spyOn(courseApi, "getCourses").mockRejectedValueOnce(new Error("x"));
      await coursesStore.asyncSetCourses();
      expect(coursesStore.$state.courses).toEqual([]);
    });
  });

  describe("asyncSetCourse", () => {
    it("should set detail and raise isCourse on success", async () => {
      vi.spyOn(courseApi, "getCourseById").mockResolvedValue({ id: 2 } as any);
      await coursesStore.asyncSetCourse(2);
      expect(coursesStore.$state.course).toEqual({ id: 2 });
      expect(coursesStore.$state.isCourse).toBe(true);
    });

    it("should set null when API returns nothing", async () => {
      vi.spyOn(courseApi, "getCourseById").mockResolvedValue(undefined);
      await coursesStore.asyncSetCourse(2);
      expect(coursesStore.$state.course).toBeNull();
      expect(coursesStore.$state.isCourse).toBe(true);
    });

    it("should set null and raise isCourse on error", async () => {
      coursesStore.setCourse({ id: 1 } as any);
      vi.spyOn(courseApi, "getCourseById").mockRejectedValue(new Error("x"));
      await coursesStore.asyncSetCourse(2);
      expect(coursesStore.$state.course).toBeNull();
      expect(coursesStore.$state.isCourse).toBe(true);
    });
  });

  describe("asyncSetContent", () => {
    it("should set the content and raise isContent on success", async () => {
      vi.spyOn(courseApi, "getContentById").mockResolvedValue({ id: 3 } as any);
      await coursesStore.asyncSetContent(3);
      expect(coursesStore.$state.content).toEqual({ id: 3 });
      expect(coursesStore.$state.isContent).toBe(true);
    });

    it("should set null when API returns nothing", async () => {
      vi.spyOn(courseApi, "getContentById").mockResolvedValue(undefined);
      await coursesStore.asyncSetContent(3);
      expect(coursesStore.$state.content).toBeNull();
    });

    it("should set null and raise isContent on error", async () => {
      coursesStore.setContent({ id: 1 } as any);
      vi.spyOn(courseApi, "getContentById").mockRejectedValue(new Error("x"));
      await coursesStore.asyncSetContent(3);
      expect(coursesStore.$state.content).toBeNull();
      expect(coursesStore.$state.isContent).toBe(true);
    });
  });

  // [metode store, metode API, argumen, bendera selesai, bendera hasil, pesan fallback]
  const mutations: any[] = [
    ["asyncSetIsCourseChange", "putCourse", [1, "T", "D"], "isCourseChange", "isCourseChanged", "Kursus berhasil diperbarui!"],
    ["asyncSetIsCourseChangeCover", "postCourseCover", [1, new File(["x"], "a.png")], "isCourseChangeCover", "isCourseChangedCover", "Sampul berhasil diperbarui!"],
    ["asyncSetIsCourseDelete", "deleteCourse", [1], "isCourseDelete", "isCourseDeleted", "Kursus berhasil dihapus!"],
    ["asyncSetIsCourseDeleteAll", "deleteAllCourses", [], "isCourseDeleteAll", "isCourseDeletedAll", "Semua kursus berhasil dihapus!"],
    ["asyncSetIsStudentJoin", "postStudent", [1], "isStudentJoin", "isStudentJoined", "Berhasil bergabung ke kursus!"],
    ["asyncSetIsStudentLeave", "deleteStudent", [1], "isStudentLeave", "isStudentLeft", "Berhasil keluar dari kursus!"],
    ["asyncSetIsRatingChange", "postRating", [1, 5], "isRatingChange", "isRatingChanged", "Rating berhasil disimpan!"],
    ["asyncSetIsContentAdd", "postContent", [1, "T", "https://youtu.be/abcdefghijk"], "isContentAdd", "isContentAdded", "Konten berhasil ditambahkan!"],
    ["asyncSetIsContentChange", "putContent", [1, 2, "T", "https://youtu.be/abcdefghijk"], "isContentChange", "isContentChanged", "Konten berhasil diperbarui!"],
    ["asyncSetIsContentDelete", "deleteContent", [1, 2], "isContentDelete", "isContentDeleted", "Konten berhasil dihapus!"],
    ["asyncSetIsContentStatusChange", "putContentStatus", [2, 1], "isContentStatusChange", "isContentStatusChanged", "Status belajar berhasil diperbarui!"],
  ];

  describe.each(mutations)("%s", (method, apiMethod, args, finishFlag, doneFlag, fallback) => {
    it("should call API, show the API message, and set flags on success", async () => {
      const spy = vi.spyOn(courseApi as any, apiMethod).mockResolvedValue("Pesan dari API");
      await (coursesStore as any)[method](...args);

      expect(spy).toHaveBeenCalledWith(...args);
      expect(coursesStore.$state[doneFlag as keyof typeof coursesStore.$state]).toBe(true);
      expect(coursesStore.$state[finishFlag as keyof typeof coursesStore.$state]).toBe(true);
      expect(toolsHelper.showSuccessDialog).toHaveBeenCalledWith("Pesan dari API");
    });

    it("should show the fallback message when API returns no message", async () => {
      vi.spyOn(courseApi as any, apiMethod).mockResolvedValue(undefined);
      await (coursesStore as any)[method](...args);
      expect(toolsHelper.showSuccessDialog).toHaveBeenCalledWith(fallback);
    });

    it("should show an error and keep the result flag false on failure", async () => {
      vi.spyOn(courseApi as any, apiMethod).mockRejectedValue(new Error("Boom"));
      await (coursesStore as any)[method](...args);

      expect(toolsHelper.showErrorDialog).toHaveBeenCalledWith("Boom");
      expect(coursesStore.$state[doneFlag as keyof typeof coursesStore.$state]).toBe(false);
      expect(coursesStore.$state[finishFlag as keyof typeof coursesStore.$state]).toBe(true);
    });
  });

  describe("asyncSetIsCourseAdd", () => {
    it("should always use its own message (API returns data, not a message)", async () => {
      vi.spyOn(courseApi, "postCourse").mockResolvedValue({ course_id: 1 });
      await coursesStore.asyncSetIsCourseAdd("T", "D");
      expect(courseApi.postCourse).toHaveBeenCalledWith("T", "D");
      expect(toolsHelper.showSuccessDialog).toHaveBeenCalledWith("Kursus berhasil ditambahkan!");
      expect(coursesStore.$state.isCourseAdded).toBe(true);
      expect(coursesStore.$state.isCourseAdd).toBe(true);
    });

    it("should report errors", async () => {
      vi.spyOn(courseApi, "postCourse").mockRejectedValue(new Error("Boom"));
      await coursesStore.asyncSetIsCourseAdd("T", "D");
      expect(toolsHelper.showErrorDialog).toHaveBeenCalledWith("Boom");
      expect(coursesStore.$state.isCourseAdded).toBe(false);
      expect(coursesStore.$state.isCourseAdd).toBe(true);
    });
  });
});
