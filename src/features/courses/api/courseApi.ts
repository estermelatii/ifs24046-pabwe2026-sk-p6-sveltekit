import apiHelper from "../../../helpers/apiHelper";
import type { Course, CourseContent, Id } from "../courseUtils";

declare const DELCOM_BASEURL: string;

const courseApi = (() => {
  const BASE_URL = `${DELCOM_BASEURL}/courses`;

  function _url(path: string): string {
    return BASE_URL + path;
  }

  const JSON_HEADERS = { "Content-Type": "application/json" };

  // Pembungkus tunggal: kirim request, baca JSON, lempar error bila status bukan "success".
  async function request(path: string, options: RequestInit, fallbackMessage: string): Promise<any> {
    const response = await apiHelper.fetchData(_url(path), options);
    const result = await response.json();
    if (result.status !== "success") {
      throw new Error(result.message || fallbackMessage);
    }
    return result;
  }

  const json = (method: string, body: unknown): RequestInit => ({
    method,
    headers: JSON_HEADERS,
    body: JSON.stringify(body),
  });

  // ---- Kursus ----
  async function postCourse(title: string, description: string): Promise<any> {
    const result = await request("/", json("POST", { title, description }), "Gagal menambahkan kursus");
    return result.data;
  }

  async function postCourseCover(courseId: Id, cover: File): Promise<string> {
    const formData = new FormData();
    formData.append("cover", cover, cover.name || "cover.jpg");
    const result = await request(
      `/${courseId}/cover`,
      { method: "POST", body: formData },
      "Gagal mengubah sampul"
    );
    return result.message;
  }

  async function putCourse(courseId: Id, title: string, description: string): Promise<string> {
    const result = await request(
      `/${courseId}`,
      json("PUT", { title, description }),
      "Gagal mengubah kursus"
    );
    return result.message;
  }

  async function getCourses(): Promise<Course[]> {
    const result = await request("/", { method: "GET" }, "Gagal mengambil data kursus");
    return result.data?.courses || [];
  }

  async function getCourseById(courseId: Id): Promise<Course | undefined> {
    const result = await request(`/${courseId}`, { method: "GET" }, "Gagal mengambil detail kursus");
    const course = result.data?.course;
    if (!course) return undefined;
    return {
      ...course,
      students: course.students || [],
      ratings: course.ratings || [],
      contents: course.contents || [],
    };
  }

  async function deleteCourse(courseId: Id): Promise<string> {
    const result = await request(`/${courseId}`, { method: "DELETE" }, "Gagal menghapus kursus");
    return result.message;
  }

  async function deleteAllCourses(): Promise<string> {
    const result = await request("/", { method: "DELETE" }, "Gagal menghapus semua kursus");
    return result.message;
  }

  // ---- Peserta & rating ----
  async function postStudent(courseId: Id): Promise<string> {
    const result = await request(`/${courseId}/students`, { method: "POST" }, "Gagal bergabung ke kursus");
    return result.message;
  }

  async function deleteStudent(courseId: Id): Promise<string> {
    const result = await request(`/${courseId}/students`, { method: "DELETE" }, "Gagal keluar dari kursus");
    return result.message;
  }

  async function postRating(courseId: Id, rating: number): Promise<string> {
    const result = await request(
      `/${courseId}/ratings`,
      json("POST", { rating }),
      "Gagal memberi rating"
    );
    return result.message;
  }

  // ---- Konten ----
  async function postContent(courseId: Id, title: string, youtube: string): Promise<string> {
    const result = await request(
      `/${courseId}/contents`,
      json("POST", { title, youtube }),
      "Gagal menambahkan konten"
    );
    return result.message;
  }

  async function putContent(courseId: Id, contentId: Id, title: string, youtube: string): Promise<string> {
    const result = await request(
      `/${courseId}/contents/${contentId}`,
      json("PUT", { title, youtube }),
      "Gagal mengubah konten"
    );
    return result.message;
  }

  async function getContentById(contentId: Id): Promise<CourseContent | undefined> {
    const result = await request(`/-/contents/${contentId}`, { method: "GET" }, "Gagal mengambil detail konten");
    return result.data?.course_content;
  }

  async function deleteContent(courseId: Id, contentId: Id): Promise<string> {
    const result = await request(
      `/${courseId}/contents/${contentId}`,
      { method: "DELETE" },
      "Gagal menghapus konten"
    );
    return result.message;
  }

  async function putContentStatus(contentId: Id, status: 0 | 1): Promise<string> {
    const result = await request(
      `/-/contents/${contentId}/learns`,
      json("PUT", { status }),
      "Gagal mengubah status belajar"
    );
    return result.message;
  }

  return {
    postCourse,
    postCourseCover,
    putCourse,
    getCourses,
    getCourseById,
    deleteCourse,
    deleteAllCourses,
    postStudent,
    deleteStudent,
    postRating,
    postContent,
    putContent,
    getContentById,
    deleteContent,
    putContentStatus,
  };
})();

export default courseApi;
