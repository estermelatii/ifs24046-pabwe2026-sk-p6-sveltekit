import { describe, it, expect, vi, beforeEach } from "vitest";
import ChangeCoverModal from "./ChangeCoverModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

describe("ChangeCoverModal", () => {
  const mockCourse = { id: 1, title: "Course Test" };

  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn().mockReturnValue("blob:mock-url");
  });

  it("should not render when show is false", () => {
    const { wrapper } = renderWithProviders(ChangeCoverModal, {
      props: { show: false, course: mockCourse },
    });
    expect(wrapper.find('[data-testid="change-cover-modal"]').exists()).toBe(false);
  });

  it("should validate file presence, file type, and file size", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockImplementation(() => {});

    const { wrapper } = renderWithProviders(ChangeCoverModal, {
      props: { show: true, course: mockCourse },
    });

    const form = wrapper.find("form");
    await form.trigger("submit");
    expect(errorSpy).toHaveBeenCalledWith("Silakan pilih sampul baru!");

    // Empty files test
    const fileInput = wrapper.find('[data-testid="cover-file-input"]');
    await fileInput.trigger("change");

    // Non-image file test
    const badFile = new File(["dummy"], "doc.pdf", { type: "application/pdf" });
    Object.defineProperty(fileInput.element, "files", {
      value: [badFile],
      configurable: true,
    });
    await fileInput.trigger("change");
    expect(errorSpy).toHaveBeenCalledWith("Pilih file gambar (JPG/PNG)!");

    // Large file test (>1MB)
    const largeFile = new File([new Uint8Array(2 * 1024 * 1024)], "large.png", {
      type: "image/png",
    });
    Object.defineProperty(fileInput.element, "files", {
      value: [largeFile],
      configurable: true,
    });
    await fileInput.trigger("change");
    expect(errorSpy).toHaveBeenCalledWith("Ukuran gambar maksimal 1MB!");
  });

  it("should preview selected image and dispatch cover upload on valid file", async () => {
    const closeSpy = vi.fn();
    const { wrapper, coursesStore } = renderWithProviders(ChangeCoverModal, {
      props: { show: true, course: mockCourse, onClose: closeSpy },
      preloadedState: {
        isCourseChangeCover: false,
        isCourseChangedCover: false,
      },
    });

    const changeCoverSpy = vi
      .spyOn(coursesStore, "asyncSetIsCourseChangeCover")
      .mockReturnValue(Promise.resolve());

    const fileInput = wrapper.find('[data-testid="cover-file-input"]');
    const validFile = new File(["dummy"], "photo.jpg", { type: "image/jpeg" });
    Object.defineProperty(fileInput.element, "files", {
      value: [validFile],
      configurable: true,
    });
    await fileInput.trigger("change");

    expect(wrapper.find('img[alt="Preview"]').exists()).toBe(true);

    const form = wrapper.find("form");
    await form.trigger("submit");

    expect(changeCoverSpy).toHaveBeenCalledWith(1, validFile);

    // Simulate completion
    coursesStore.setIsCourseChangeCover(true);
    coursesStore.setIsCourseChangedCover(true);
    await new Promise((r) => setTimeout(r, 10));

    expect(closeSpy).toHaveBeenCalled();
  });

  it("should handle isCourseChangeCover true when isCourseChangedCover is false", async () => {
    const { wrapper, coursesStore } = renderWithProviders(ChangeCoverModal, {
      props: { show: true, course: mockCourse },
      preloadedState: {
        isCourseChangeCover: false,
        isCourseChangedCover: false,
      },
    });

    coursesStore.setIsCourseChangeCover(true);
    coursesStore.setIsCourseChangedCover(false);
    await new Promise((r) => setTimeout(r, 10));

    expect(wrapper.find('[data-testid="change-cover-modal"]').exists()).toBe(true);
  });

  it("should trigger onClose when close or cancel button clicked", async () => {
    const closeSpy = vi.fn();
    const { wrapper } = renderWithProviders(ChangeCoverModal, {
      props: { show: true, course: mockCourse, onClose: closeSpy },
    });

    const closeBtn = wrapper.find('[data-testid="close-cover-modal-btn"]');
    await closeBtn.trigger("click");
    expect(closeSpy).toHaveBeenCalledTimes(1);

    const cancelBtn = wrapper.find('[data-testid="cancel-cover-modal-btn"]');
    await cancelBtn.trigger("click");
    expect(closeSpy).toHaveBeenCalledTimes(2);
  });

  it("should handle close without onClose callback", async () => {
    const { wrapper } = renderWithProviders(ChangeCoverModal, {
      props: { show: true, course: mockCourse },
    });

    const closeBtn = wrapper.find('[data-testid="close-cover-modal-btn"]');
    await closeBtn.trigger("click");
    expect(wrapper.exists()).toBe(true);
  });

  it("should not render when course is null", () => {
    const { wrapper } = renderWithProviders(ChangeCoverModal, {
      props: { show: true, course: null },
    });
    expect(wrapper.find('[data-testid="change-cover-modal"]').exists()).toBe(false);
  });

  it("should toggle document body overflow on show prop change", async () => {
    const { rerender } = renderWithProviders(ChangeCoverModal, {
      props: { show: true, course: mockCourse },
    });
    expect(document.body.style.overflow).toBe("hidden");

    await rerender({ show: false, course: mockCourse });
    expect(document.body.style.overflow).toBe("auto");
  });
});
