import { describe, it, expect } from "vitest";
import {
  studentId,
  isOwner,
  isStudent,
  getRole,
  myRating,
  averageRating,
  isLearned,
  parseYoutubeId,
} from "./courseUtils";

const profile = { id: 7, name: "Saya" };

describe("courseUtils", () => {
  describe("studentId", () => {
    it("should read id from a primitive or an object", () => {
      expect(studentId(5)).toBe(5);
      expect(studentId("9")).toBe("9");
      expect(studentId({ id: 3, name: "A" })).toBe(3);
    });
  });

  describe("isOwner", () => {
    it("should be false without course or profile", () => {
      expect(isOwner(null, profile)).toBe(false);
      expect(isOwner(undefined, profile)).toBe(false);
      expect(isOwner({ id: 1, user_id: 7, title: "", description: "" }, null)).toBe(false);
    });

    it("should compare user_id with profile id regardless of type", () => {
      expect(isOwner({ id: 1, user_id: 7, title: "", description: "" }, profile)).toBe(true);
      expect(isOwner({ id: 1, user_id: "7", title: "", description: "" }, profile)).toBe(true);
      expect(isOwner({ id: 1, user_id: 8, title: "", description: "" }, profile)).toBe(false);
    });
  });

  describe("isStudent", () => {
    const base = { id: 1, user_id: 1, title: "", description: "" };

    it("should be false without course or profile", () => {
      expect(isStudent(null, profile)).toBe(false);
      expect(isStudent({ ...base, students: [7] }, null)).toBe(false);
    });

    it("should be false when students is missing or has no match", () => {
      expect(isStudent(base, profile)).toBe(false);
      expect(isStudent({ ...base, students: [1, { id: 2 }] }, profile)).toBe(false);
    });

    it("should match primitive ids and user objects", () => {
      expect(isStudent({ ...base, students: [7] }, profile)).toBe(true);
      expect(isStudent({ ...base, students: ["7"] }, profile)).toBe(true);
      expect(isStudent({ ...base, students: [{ id: 7 }] }, profile)).toBe(true);
    });
  });

  describe("getRole", () => {
    const course = { id: 1, user_id: 7, title: "", description: "", students: [7] };

    it("should prefer owner when the user is both owner and student", () => {
      expect(getRole(course, profile)).toBe("owner");
    });

    it("should return student for participants", () => {
      expect(getRole({ ...course, user_id: 1 }, profile)).toBe("student");
    });

    it("should return guest otherwise", () => {
      expect(getRole({ ...course, user_id: 1, students: [] }, profile)).toBe("guest");
      expect(getRole(null, null)).toBe("guest");
    });
  });

  describe("myRating", () => {
    const base = { id: 1, user_id: 1, title: "", description: "" };

    it("should be 0 without course, profile, ratings, or a matching rating", () => {
      expect(myRating(null, profile)).toBe(0);
      expect(myRating({ ...base, ratings: [] }, null)).toBe(0);
      expect(myRating(base, profile)).toBe(0);
      expect(myRating({ ...base, ratings: [{ user_id: 2, rating: 5 }] }, profile)).toBe(0);
    });

    it("should return the rating given by the profile", () => {
      expect(
        myRating({ ...base, ratings: [{ user_id: 2, rating: 5 }, { user_id: "7", rating: 4 }] }, profile)
      ).toBe(4);
    });
  });

  describe("averageRating", () => {
    const base = { id: 1, user_id: 1, title: "", description: "" };

    it("should be 0 without ratings", () => {
      expect(averageRating(null)).toBe(0);
      expect(averageRating(undefined)).toBe(0);
      expect(averageRating(base)).toBe(0);
      expect(averageRating({ ...base, ratings: [] })).toBe(0);
    });

    it("should average and round to one decimal", () => {
      const ratings = [5, 4, 4].map((rating, i) => ({ user_id: i, rating }));
      expect(averageRating({ ...base, ratings })).toBe(4.3);
    });
  });

  describe("isLearned", () => {
    it("should treat status 1 and true as learned", () => {
      expect(isLearned({ status: 1 })).toBe(true);
      expect(isLearned({ status: true })).toBe(true);
    });

    it("should treat everything else as not learned", () => {
      expect(isLearned({ status: 0 })).toBe(false);
      expect(isLearned({})).toBe(false);
      expect(isLearned(null)).toBe(false);
      expect(isLearned(undefined)).toBe(false);
    });
  });

  describe("parseYoutubeId", () => {
    it.each([
      ["https://www.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
      ["  https://youtube.com/watch?v=dQw4w9WgXcQ&t=10s ", "dQw4w9WgXcQ"],
      ["https://m.youtube.com/watch?v=dQw4w9WgXcQ", "dQw4w9WgXcQ"],
      ["https://youtu.be/dQw4w9WgXcQ?si=abc", "dQw4w9WgXcQ"],
      ["https://www.youtube.com/embed/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
      ["https://www.youtube.com/shorts/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
      ["https://www.youtube.com/live/dQw4w9WgXcQ", "dQw4w9WgXcQ"],
    ])("should extract the id from %s", (url, id) => {
      expect(parseYoutubeId(url)).toBe(id);
    });

    it.each([
      ["watch without v", "https://www.youtube.com/watch"],
      ["unsupported youtube path", "https://www.youtube.com/channel/UCabc123456"],
      ["empty youtu.be id", "https://youtu.be/"],
      ["too short id", "https://youtu.be/abc"],
      ["invalid characters", "https://www.youtube.com/watch?v=abc$%^&*()"],
      ["other host", "https://vimeo.com/123456789"],
      ["not a url", "bukan-url"],
      ["empty", ""],
    ])("should return null for %s", (_label, url) => {
      expect(parseYoutubeId(url)).toBeNull();
    });
  });
});
