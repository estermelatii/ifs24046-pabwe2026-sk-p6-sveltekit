import { describe, it, expect, vi, beforeEach } from "vitest";
import courseApi from "./courseApi";
import apiHelper from "../../../helpers/apiHelper";

const BASE = `${DELCOM_BASEURL}/courses`;

function mockResponse(body: any) {
  return vi.spyOn(apiHelper, "fetchData").mockResolvedValue({ json: async () => body } as any);
}

const jsonOptions = (method: string, body: any) => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});

describe("courseApi", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("postCourse", () => {
    it("should create a course and return data", async () => {
      const spy = mockResponse({ status: "success", data: { course_id: 10 } });
      expect(await courseApi.postCourse("Judul", "Deskripsi")).toEqual({ course_id: 10 });
      expect(spy).toHaveBeenCalledWith(`${BASE}/`, jsonOptions("POST", { title: "Judul", description: "Deskripsi" }));
    });

    it("should throw the API message, or a fallback", async () => {
      mockResponse({ status: "fail", message: "Data tidak valid" });
      await expect(courseApi.postCourse("", "")).rejects.toThrow("Data tidak valid");
      mockResponse({ status: "fail" });
      await expect(courseApi.postCourse("", "")).rejects.toThrow("Gagal menambahkan kursus");
    });
  });

  describe("postCourseCover", () => {
    it("should upload the cover as FormData", async () => {
      const spy = mockResponse({ status: "success", message: "Berhasil" });
      const file = new File(["x"], "cover.png", { type: "image/png" });

      expect(await courseApi.postCourseCover(5, file)).toBe("Berhasil");
      const [url, options] = spy.mock.calls[0] as any;
      expect(url).toBe(`${BASE}/5/cover`);
      expect(options.method).toBe("POST");
      expect(options.body.get("cover").name).toBe("cover.png");
    });

    it("should fall back to cover.jpg for unnamed blobs", async () => {
      const spy = mockResponse({ status: "success", message: "ok" });
      await courseApi.postCourseCover(5, new Blob(["x"]) as any);
      expect((spy.mock.calls[0][1] as any).body.get("cover").name).toBe("cover.jpg");
    });

    it("should throw on failure", async () => {
      mockResponse({ status: "fail" });
      await expect(courseApi.postCourseCover(5, new File(["x"], "a.png"))).rejects.toThrow("Gagal mengubah sampul");
    });
  });

  describe("putCourse", () => {
    it("should update a course", async () => {
      const spy = mockResponse({ status: "success", message: "Diubah" });
      expect(await courseApi.putCourse(3, "A", "B")).toBe("Diubah");
      expect(spy).toHaveBeenCalledWith(`${BASE}/3`, jsonOptions("PUT", { title: "A", description: "B" }));
    });

    it("should throw on failure", async () => {
      mockResponse({ status: "fail" });
      await expect(courseApi.putCourse(3, "A", "B")).rejects.toThrow("Gagal mengubah kursus");
    });
  });

  describe("getCourses", () => {
    it("should return data.courses", async () => {
      const spy = mockResponse({ status: "success", data: { courses: [{ id: 1 }] } });
      expect(await courseApi.getCourses()).toEqual([{ id: 1 }]);
      expect(spy).toHaveBeenCalledWith(`${BASE}/`, { method: "GET" });
    });

    it("should return an empty array when data is missing", async () => {
      mockResponse({ status: "success" });
      expect(await courseApi.getCourses()).toEqual([]);
    });

    it("should throw on failure", async () => {
      mockResponse({ status: "fail" });
      await expect(courseApi.getCourses()).rejects.toThrow("Gagal mengambil data kursus");
    });
  });

  describe("getCourseById", () => {
    it("should return data.course with its collections", async () => {
      const spy = mockResponse({
        status: "success",
        data: { course: { id: 1, students: [2], ratings: [{ user_id: 2, rating: 5 }], contents: [{ id: 9 }] } },
      });
      expect(await courseApi.getCourseById(1)).toEqual({
        id: 1,
        students: [2],
        ratings: [{ user_id: 2, rating: 5 }],
        contents: [{ id: 9 }],
      });
      expect(spy).toHaveBeenCalledWith(`${BASE}/1`, { method: "GET" });
    });

    it("should default missing collections to empty arrays", async () => {
      mockResponse({ status: "success", data: { course: { id: 1 } } });
      expect(await courseApi.getCourseById(1)).toEqual({ id: 1, students: [], ratings: [], contents: [] });
    });

    it("should return undefined when course is absent", async () => {
      mockResponse({ status: "success", data: {} });
      expect(await courseApi.getCourseById(1)).toBeUndefined();
      mockResponse({ status: "success" });
      expect(await courseApi.getCourseById(1)).toBeUndefined();
    });

    it("should throw on failure", async () => {
      mockResponse({ status: "fail" });
      await expect(courseApi.getCourseById(1)).rejects.toThrow("Gagal mengambil detail kursus");
    });
  });

  describe("deleteCourse / deleteAllCourses", () => {
    it("should delete one course", async () => {
      const spy = mockResponse({ status: "success", message: "Dihapus" });
      expect(await courseApi.deleteCourse(4)).toBe("Dihapus");
      expect(spy).toHaveBeenCalledWith(`${BASE}/4`, { method: "DELETE" });
    });

    it("should delete all courses", async () => {
      const spy = mockResponse({ status: "success", message: "Semua dihapus" });
      expect(await courseApi.deleteAllCourses()).toBe("Semua dihapus");
      expect(spy).toHaveBeenCalledWith(`${BASE}/`, { method: "DELETE" });
    });

    it("should throw on failure", async () => {
      mockResponse({ status: "fail" });
      await expect(courseApi.deleteCourse(4)).rejects.toThrow("Gagal menghapus kursus");
      await expect(courseApi.deleteAllCourses()).rejects.toThrow("Gagal menghapus semua kursus");
    });
  });

  describe("students and ratings", () => {
    it("should join a course", async () => {
      const spy = mockResponse({ status: "success", message: "Bergabung" });
      expect(await courseApi.postStudent(1)).toBe("Bergabung");
      expect(spy).toHaveBeenCalledWith(`${BASE}/1/students`, { method: "POST" });
    });

    it("should leave a course", async () => {
      const spy = mockResponse({ status: "success", message: "Keluar" });
      expect(await courseApi.deleteStudent(1)).toBe("Keluar");
      expect(spy).toHaveBeenCalledWith(`${BASE}/1/students`, { method: "DELETE" });
    });

    it("should post a rating", async () => {
      const spy = mockResponse({ status: "success", message: "Rating disimpan" });
      expect(await courseApi.postRating(1, 4)).toBe("Rating disimpan");
      expect(spy).toHaveBeenCalledWith(`${BASE}/1/ratings`, jsonOptions("POST", { rating: 4 }));
    });

    it("should throw on failures", async () => {
      mockResponse({ status: "fail" });
      await expect(courseApi.postStudent(1)).rejects.toThrow("Gagal bergabung ke kursus");
      await expect(courseApi.deleteStudent(1)).rejects.toThrow("Gagal keluar dari kursus");
      await expect(courseApi.postRating(1, 4)).rejects.toThrow("Gagal memberi rating");
    });
  });

  describe("contents", () => {
    it("should add a content", async () => {
      const spy = mockResponse({ status: "success", message: "Ditambah" });
      expect(await courseApi.postContent(1, "Intro", "https://youtu.be/abcdefghijk")).toBe("Ditambah");
      expect(spy).toHaveBeenCalledWith(
        `${BASE}/1/contents`,
        jsonOptions("POST", { title: "Intro", youtube: "https://youtu.be/abcdefghijk" })
      );
    });

    it("should update a content", async () => {
      const spy = mockResponse({ status: "success", message: "Diubah" });
      expect(await courseApi.putContent(1, 7, "Baru", "https://youtu.be/abcdefghijk")).toBe("Diubah");
      expect(spy).toHaveBeenCalledWith(
        `${BASE}/1/contents/7`,
        jsonOptions("PUT", { title: "Baru", youtube: "https://youtu.be/abcdefghijk" })
      );
    });

    it("should get content detail from data.course_content", async () => {
      const spy = mockResponse({ status: "success", data: { course_content: { id: 7, title: "Intro" } } });
      expect(await courseApi.getContentById(7)).toEqual({ id: 7, title: "Intro" });
      expect(spy).toHaveBeenCalledWith(`${BASE}/-/contents/7`, { method: "GET" });
    });

    it("should return undefined when course_content is absent", async () => {
      mockResponse({ status: "success" });
      expect(await courseApi.getContentById(7)).toBeUndefined();
    });

    it("should delete a content", async () => {
      const spy = mockResponse({ status: "success", message: "Dihapus" });
      expect(await courseApi.deleteContent(1, 7)).toBe("Dihapus");
      expect(spy).toHaveBeenCalledWith(`${BASE}/1/contents/7`, { method: "DELETE" });
    });

    it("should update the learning status with 0 or 1", async () => {
      const spy = mockResponse({ status: "success", message: "Status diubah" });
      expect(await courseApi.putContentStatus(7, 1)).toBe("Status diubah");
      expect(spy).toHaveBeenCalledWith(`${BASE}/-/contents/7/learns`, jsonOptions("PUT", { status: 1 }));
      await courseApi.putContentStatus(7, 0);
      expect(spy).toHaveBeenLastCalledWith(`${BASE}/-/contents/7/learns`, jsonOptions("PUT", { status: 0 }));
    });

    it("should throw on failures", async () => {
      mockResponse({ status: "fail" });
      await expect(courseApi.postContent(1, "a", "b")).rejects.toThrow("Gagal menambahkan konten");
      await expect(courseApi.putContent(1, 7, "a", "b")).rejects.toThrow("Gagal mengubah konten");
      await expect(courseApi.getContentById(7)).rejects.toThrow("Gagal mengambil detail konten");
      await expect(courseApi.deleteContent(1, 7)).rejects.toThrow("Gagal menghapus konten");
      await expect(courseApi.putContentStatus(7, 1)).rejects.toThrow("Gagal mengubah status belajar");
    });
  });
});
