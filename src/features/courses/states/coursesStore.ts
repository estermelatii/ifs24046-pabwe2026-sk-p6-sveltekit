import { writable } from "svelte/store";
import courseApi from "../api/courseApi";
import type { Course, CourseContent, Id } from "../courseUtils";
import { showErrorDialog, showSuccessDialog } from "../../../helpers/toolsHelper";

export interface CoursesState {
  courses: Course[];
  course: Course | null;
  content: CourseContent | null;
  isCourse: boolean;
  isCourseAdd: boolean;
  isCourseAdded: boolean;
  isCourseChange: boolean;
  isCourseChanged: boolean;
  isCourseChangeCover: boolean;
  isCourseChangedCover: boolean;
  isCourseDelete: boolean;
  isCourseDeleted: boolean;
  isCourseDeleteAll: boolean;
  isCourseDeletedAll: boolean;
  isStudentJoin: boolean;
  isStudentJoined: boolean;
  isStudentLeave: boolean;
  isStudentLeft: boolean;
  isRatingChange: boolean;
  isRatingChanged: boolean;
  isContent: boolean;
  isContentAdd: boolean;
  isContentAdded: boolean;
  isContentChange: boolean;
  isContentChanged: boolean;
  isContentDelete: boolean;
  isContentDeleted: boolean;
  isContentStatusChange: boolean;
  isContentStatusChanged: boolean;
}

function createCoursesStore() {
  const initial: CoursesState = {
    courses: [],
    course: null,
    content: null,
    isCourse: false,
    isCourseAdd: false,
    isCourseAdded: false,
    isCourseChange: false,
    isCourseChanged: false,
    isCourseChangeCover: false,
    isCourseChangedCover: false,
    isCourseDelete: false,
    isCourseDeleted: false,
    isCourseDeleteAll: false,
    isCourseDeletedAll: false,
    isStudentJoin: false,
    isStudentJoined: false,
    isStudentLeave: false,
    isStudentLeft: false,
    isRatingChange: false,
    isRatingChanged: false,
    isContent: false,
    isContentAdd: false,
    isContentAdded: false,
    isContentChange: false,
    isContentChanged: false,
    isContentDelete: false,
    isContentDeleted: false,
    isContentStatusChange: false,
    isContentStatusChanged: false,
  };

  let currentState: CoursesState = { ...initial };
  const innerStore = writable<CoursesState>(currentState);
  innerStore.subscribe((val) => {
    currentState = val;
  });

  const setter =
    <K extends keyof CoursesState>(key: K) =>
    (value: CoursesState[K]) =>
      innerStore.update((s) => ({ ...s, [key]: value }));

  // Pola mutasi yang sama untuk semua aksi tambah/ubah/hapus:
  // panggil API, tampilkan dialog, set bendera hasil lalu bendera selesai.
  async function mutate(
    call: () => Promise<string | void>,
    successFallback: string,
    setDone: (value: boolean) => void,
    setFinish: (value: boolean) => void
  ): Promise<void> {
    try {
      const message = await call();
      showSuccessDialog(message || successFallback);
      setDone(true);
    } catch (error: any) {
      showErrorDialog(error.message);
      setDone(false);
    } finally {
      setFinish(true);
    }
  }

  const store = {
    subscribe: innerStore.subscribe,
    get $state(): CoursesState {
      return currentState;
    },
    reset(state: Partial<CoursesState> = {}) {
      innerStore.set({ ...initial, ...state });
    },
    setCourses: setter("courses"),
    setCourse: setter("course"),
    setContent: setter("content"),
    setIsCourse: setter("isCourse"),
    setIsCourseAdd: setter("isCourseAdd"),
    setIsCourseAdded: setter("isCourseAdded"),
    setIsCourseChange: setter("isCourseChange"),
    setIsCourseChanged: setter("isCourseChanged"),
    setIsCourseChangeCover: setter("isCourseChangeCover"),
    setIsCourseChangedCover: setter("isCourseChangedCover"),
    setIsCourseDelete: setter("isCourseDelete"),
    setIsCourseDeleted: setter("isCourseDeleted"),
    setIsCourseDeleteAll: setter("isCourseDeleteAll"),
    setIsCourseDeletedAll: setter("isCourseDeletedAll"),
    setIsStudentJoin: setter("isStudentJoin"),
    setIsStudentJoined: setter("isStudentJoined"),
    setIsStudentLeave: setter("isStudentLeave"),
    setIsStudentLeft: setter("isStudentLeft"),
    setIsRatingChange: setter("isRatingChange"),
    setIsRatingChanged: setter("isRatingChanged"),
    setIsContent: setter("isContent"),
    setIsContentAdd: setter("isContentAdd"),
    setIsContentAdded: setter("isContentAdded"),
    setIsContentChange: setter("isContentChange"),
    setIsContentChanged: setter("isContentChanged"),
    setIsContentDelete: setter("isContentDelete"),
    setIsContentDeleted: setter("isContentDeleted"),
    setIsContentStatusChange: setter("isContentStatusChange"),
    setIsContentStatusChanged: setter("isContentStatusChanged"),

    async asyncSetCourses() {
      try {
        this.setCourses(await courseApi.getCourses());
      } catch {
        this.setCourses([]);
      }
    },
    async asyncSetCourse(courseId: Id) {
      try {
        this.setCourse((await courseApi.getCourseById(courseId)) ?? null);
      } catch {
        this.setCourse(null);
      } finally {
        this.setIsCourse(true);
      }
    },
    async asyncSetContent(contentId: Id) {
      try {
        this.setContent((await courseApi.getContentById(contentId)) ?? null);
      } catch {
        this.setContent(null);
      } finally {
        this.setIsContent(true);
      }
    },
    async asyncSetIsCourseAdd(title: string, description: string) {
      await mutate(
        async () => {
          await courseApi.postCourse(title, description);
        },
        "Kursus berhasil ditambahkan!",
        this.setIsCourseAdded,
        this.setIsCourseAdd
      );
    },
    async asyncSetIsCourseChange(courseId: Id, title: string, description: string) {
      await mutate(
        () => courseApi.putCourse(courseId, title, description),
        "Kursus berhasil diperbarui!",
        this.setIsCourseChanged,
        this.setIsCourseChange
      );
    },
    async asyncSetIsCourseChangeCover(courseId: Id, cover: File) {
      await mutate(
        () => courseApi.postCourseCover(courseId, cover),
        "Sampul berhasil diperbarui!",
        this.setIsCourseChangedCover,
        this.setIsCourseChangeCover
      );
    },
    async asyncSetIsCourseDelete(courseId: Id) {
      await mutate(
        () => courseApi.deleteCourse(courseId),
        "Kursus berhasil dihapus!",
        this.setIsCourseDeleted,
        this.setIsCourseDelete
      );
    },
    async asyncSetIsCourseDeleteAll() {
      await mutate(
        () => courseApi.deleteAllCourses(),
        "Semua kursus berhasil dihapus!",
        this.setIsCourseDeletedAll,
        this.setIsCourseDeleteAll
      );
    },
    async asyncSetIsStudentJoin(courseId: Id) {
      await mutate(
        () => courseApi.postStudent(courseId),
        "Berhasil bergabung ke kursus!",
        this.setIsStudentJoined,
        this.setIsStudentJoin
      );
    },
    async asyncSetIsStudentLeave(courseId: Id) {
      await mutate(
        () => courseApi.deleteStudent(courseId),
        "Berhasil keluar dari kursus!",
        this.setIsStudentLeft,
        this.setIsStudentLeave
      );
    },
    async asyncSetIsRatingChange(courseId: Id, rating: number) {
      await mutate(
        () => courseApi.postRating(courseId, rating),
        "Rating berhasil disimpan!",
        this.setIsRatingChanged,
        this.setIsRatingChange
      );
    },
    async asyncSetIsContentAdd(courseId: Id, title: string, youtube: string) {
      await mutate(
        () => courseApi.postContent(courseId, title, youtube),
        "Konten berhasil ditambahkan!",
        this.setIsContentAdded,
        this.setIsContentAdd
      );
    },
    async asyncSetIsContentChange(courseId: Id, contentId: Id, title: string, youtube: string) {
      await mutate(
        () => courseApi.putContent(courseId, contentId, title, youtube),
        "Konten berhasil diperbarui!",
        this.setIsContentChanged,
        this.setIsContentChange
      );
    },
    async asyncSetIsContentDelete(courseId: Id, contentId: Id) {
      await mutate(
        () => courseApi.deleteContent(courseId, contentId),
        "Konten berhasil dihapus!",
        this.setIsContentDeleted,
        this.setIsContentDelete
      );
    },
    async asyncSetIsContentStatusChange(contentId: Id, status: 0 | 1) {
      await mutate(
        () => courseApi.putContentStatus(contentId, status),
        "Status belajar berhasil diperbarui!",
        this.setIsContentStatusChanged,
        this.setIsContentStatusChange
      );
    },
  };

  return store;
}

export const coursesStore = createCoursesStore();
export const useCoursesStore = () => coursesStore;
export default coursesStore;
