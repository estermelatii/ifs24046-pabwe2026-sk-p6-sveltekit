export type Id = number | string;

export interface CourseStudent {
  id: Id;
  name?: string;
  email?: string;
}

export type StudentRef = Id | CourseStudent;

export interface CourseRating {
  user_id: Id;
  rating: number;
}

export interface CourseContent {
  id: Id;
  course_id?: Id;
  title: string;
  youtube: string;
  status?: number | boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Course {
  id: Id;
  user_id: Id;
  title: string;
  description: string;
  cover?: string | null;
  students?: StudentRef[];
  ratings?: CourseRating[];
  contents?: CourseContent[];
  created_at?: string;
  updated_at?: string;
}

export interface ProfileLike {
  id: Id;
  name?: string;
}

export type CourseRole = "owner" | "student" | "guest";

/** Peserta bisa berupa id langsung atau objek pengguna; keduanya dipakai API. */
export function studentId(student: StudentRef): Id {
  return typeof student === "object" ? student.id : student;
}

export function isOwner(course: Course | null | undefined, profile: ProfileLike | null | undefined): boolean {
  if (!course || !profile) return false;
  return String(course.user_id) === String(profile.id);
}

export function isStudent(course: Course | null | undefined, profile: ProfileLike | null | undefined): boolean {
  if (!course || !profile) return false;
  return (course.students || []).some((s) => String(studentId(s)) === String(profile.id));
}

/** Antarmuka pemilik didahulukan bila pengguna sekaligus pemilik dan peserta. */
export function getRole(course: Course | null | undefined, profile: ProfileLike | null | undefined): CourseRole {
  if (isOwner(course, profile)) return "owner";
  if (isStudent(course, profile)) return "student";
  return "guest";
}

export function myRating(course: Course | null | undefined, profile: ProfileLike | null | undefined): number {
  if (!course || !profile) return 0;
  const found = (course.ratings || []).find((r) => String(r.user_id) === String(profile.id));
  return found ? found.rating : 0;
}

export function averageRating(course: Course | null | undefined): number {
  const ratings = course?.ratings || [];
  if (ratings.length === 0) return 0;
  const total = ratings.reduce((sum, r) => sum + r.rating, 0);
  return Math.round((total / ratings.length) * 10) / 10;
}

export function isLearned(content: Pick<CourseContent, "status"> | null | undefined): boolean {
  return Number(content?.status) === 1;
}

/** Mengambil id video dari tautan YouTube (watch, youtu.be, embed, shorts, live). */
export function parseYoutubeId(url: string): string | null {
  try {
    const parsed = new URL(url.trim());
    const host = parsed.hostname.replace(/^(www|m)\./, "");
    let id: string | null = null;
    if (host === "youtu.be") {
      id = parsed.pathname.slice(1).split("/")[0];
    } else if (host === "youtube.com") {
      if (parsed.pathname === "/watch") {
        id = parsed.searchParams.get("v");
      } else {
        const match = parsed.pathname.match(/^\/(embed|shorts|live)\/([^/]+)/);
        id = match ? match[2] : null;
      }
    }
    return id && /^[\w-]{6,}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}
