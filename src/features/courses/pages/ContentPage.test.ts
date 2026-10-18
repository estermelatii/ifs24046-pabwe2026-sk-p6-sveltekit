import { describe, it, expect, vi, beforeEach } from "vitest";
import ContentPage from "./ContentPage.svelte";
import { renderWithProviders } from "../../../test-utils";
import { coursesStore as store } from "../states/coursesStore";

const tick = () => new Promise((r) => setTimeout(r, 10));

const profile = { id: 1, name: "Saya" };
const course: any = { id: 5, user_id: 1, title: "Web Lanjut", description: "d", students: [] };
const content: any = { id: 11, title: "Pengenalan", youtube: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", status: 0 };

function setup(state: Record<string, any> = {}) {
  return renderWithProviders(ContentPage, {
    props: { courseId: "5", contentId: "11" },
    preloadedState: { profile, course, content, ...state },
  });
}

describe("ContentPage", () => {
  let courseSpy: any;
  let contentSpy: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    courseSpy = vi.spyOn(store, "asyncSetCourse").mockImplementation(async () => {});
    contentSpy = vi.spyOn(store, "asyncSetContent").mockImplementation(async () => {});
  });

  it("should load the course and the content on mount", () => {
    setup();
    expect(courseSpy).toHaveBeenCalledWith("5");
    expect(contentSpy).toHaveBeenCalledWith("11");
  });

  it("should show a spinner with a hidden h1 while data is missing", () => {
    for (const state of [{ profile: null }, { course: null }, { content: null }]) {
      const { wrapper } = setup(state);
      expect(wrapper.find(".animate-spin").exists()).toBe(true);
      expect(wrapper.find("h1").text()).toBe("Memuat materi");
    }
  });

  it("should render the YouTube player for the owner with one h1 and no main landmark", () => {
    const { wrapper } = setup();
    const player = wrapper.find('[data-testid="youtube-player"]');
    expect(player.attributes("src")).toBe("https://www.youtube.com/embed/dQw4w9WgXcQ");
    expect(player.attributes("title")).toBe("Video: Pengenalan");
    expect(wrapper.findAll("h1").length).toBe(1);
    expect(wrapper.find("h1").text()).toBe("Pengenalan");
    expect(wrapper.find("main").exists()).toBe(false);
  });

  it("should link back to the course", () => {
    const { wrapper } = setup();
    const link = wrapper.find('[data-testid="back-to-course-link"]');
    expect(link.attributes("href")).toBe("/courses/5");
    expect(link.text()).toContain("Web Lanjut");
  });

  it("should render the player for students too", () => {
    const { wrapper } = setup({ course: { ...course, user_id: 9, students: [1] } });
    expect(wrapper.find('[data-testid="youtube-player"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="content-locked"]').exists()).toBe(false);
  });

  it("should lock the video for guests but keep a single h1", () => {
    const { wrapper } = setup({ course: { ...course, user_id: 9, students: [] } });
    expect(wrapper.find('[data-testid="content-locked"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="youtube-player"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="toggle-status-btn"]').exists()).toBe(false);
    expect(wrapper.findAll("h1").length).toBe(1);
  });

  it("should fall back to a link when the video url is not valid", () => {
    const { wrapper } = setup({ content: { ...content, youtube: "https://example.com/video" } });
    expect(wrapper.find('[data-testid="youtube-player"]').exists()).toBe(false);
    const fallback = wrapper.find('[data-testid="video-fallback"]');
    expect(fallback.exists()).toBe(true);
    expect(fallback.find("a").attributes("href")).toBe("https://example.com/video");
    expect(fallback.find("a").attributes("rel")).toBe("noopener noreferrer");
  });

  it("should mark an unlearned content as done (status 1)", async () => {
    const { wrapper, coursesStore } = setup();
    const statusSpy = vi.spyOn(coursesStore, "asyncSetIsContentStatusChange").mockResolvedValue();
    const button = wrapper.find('[data-testid="toggle-status-btn"]');
    expect(button.text()).toContain("Tandai Selesai");
    expect(button.attributes("aria-pressed")).toBe("false");

    button.element.click();
    await tick();
    expect(statusSpy).toHaveBeenCalledWith("11", 1);
  });

  it("should mark a learned content as not done (status 0)", async () => {
    const { wrapper, coursesStore } = setup({ content: { ...content, status: 1 } });
    const statusSpy = vi.spyOn(coursesStore, "asyncSetIsContentStatusChange").mockResolvedValue();
    const button = wrapper.find('[data-testid="toggle-status-btn"]');
    expect(button.text()).toContain("Selesai Dipelajari");
    expect(button.attributes("aria-pressed")).toBe("true");

    button.element.click();
    await tick();
    expect(statusSpy).toHaveBeenCalledWith("11", 0);
  });

  it("should reload the content after the status changed successfully", async () => {
    const { coursesStore } = setup();
    contentSpy.mockClear();

    coursesStore.setIsContentStatusChange(true);
    coursesStore.setIsContentStatusChanged(true);
    await tick();

    expect(contentSpy).toHaveBeenCalledWith("11");
    expect(coursesStore.$state.isContentStatusChange).toBe(false);
    expect(coursesStore.$state.isContentStatusChanged).toBe(false);
  });

  it("should not reload the content when the status change failed", async () => {
    const { coursesStore } = setup();
    contentSpy.mockClear();

    coursesStore.setIsContentStatusChange(true);
    await tick();

    expect(contentSpy).not.toHaveBeenCalled();
  });

  it("should go home when the course could not be loaded", async () => {
    const { coursesStore, mockGoto } = setup({ course: null });
    mockGoto.mockClear();
    coursesStore.setIsCourse(true);
    await tick();
    expect(mockGoto).toHaveBeenCalledWith("/");
    expect(coursesStore.$state.isCourse).toBe(false);
  });

  it("should stay when the course loaded", async () => {
    const { coursesStore, mockGoto } = setup();
    mockGoto.mockClear();
    coursesStore.setIsCourse(true);
    await tick();
    expect(mockGoto).not.toHaveBeenCalled();
  });

  it("should go back to the course when the content could not be loaded", async () => {
    const { coursesStore, mockGoto } = setup({ content: null });
    mockGoto.mockClear();
    coursesStore.setIsContent(true);
    await tick();
    expect(mockGoto).toHaveBeenCalledWith("/courses/5");
    expect(coursesStore.$state.isContent).toBe(false);
  });

  it("should stay when the content loaded", async () => {
    const { coursesStore, mockGoto } = setup();
    mockGoto.mockClear();
    coursesStore.setIsContent(true);
    await tick();
    expect(mockGoto).not.toHaveBeenCalled();
  });
});
