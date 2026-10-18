import { describe, it, expect, vi, beforeEach } from "vitest";
import AddModal from "./AddModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

const tick = () => new Promise((r) => setTimeout(r, 10));

describe("AddModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should not render when show is false", () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: false } });
    expect(wrapper.find('[data-testid="add-course-modal"]').exists()).toBe(false);
    expect(document.body.style.overflow).toBe("auto");
  });

  it("should lock body scroll when shown and use h2 for its title", () => {
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true } });
    expect(document.body.style.overflow).toBe("hidden");
    expect(wrapper.find("h2").text()).toBe("Tambah Kursus Baru");
  });

  it("should validate title and description", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockResolvedValue(undefined as any);
    const { wrapper } = renderWithProviders(AddModal, { props: { show: true } });

    wrapper.find("form").element.dispatchEvent(new Event("submit", { cancelable: true }));
    await tick();
    expect(errorSpy).toHaveBeenLastCalledWith("Judul tidak boleh kosong");

    await wrapper.find('[data-testid="add-course-title-input"]').setValue("Judul");
    wrapper.find("form").element.dispatchEvent(new Event("submit", { cancelable: true }));
    await tick();
    expect(errorSpy).toHaveBeenLastCalledWith("Deskripsi tidak boleh kosong");
  });

  it("should submit trimmed values, then reload and close and reset on success", async () => {
    const closeSpy = vi.fn();
    const { wrapper, coursesStore } = renderWithProviders(AddModal, { props: { show: true, onClose: closeSpy } });
    const addSpy = vi.spyOn(coursesStore, "asyncSetIsCourseAdd").mockResolvedValue();
    const reloadSpy = vi.spyOn(coursesStore, "asyncSetCourses").mockResolvedValue();

    await wrapper.find('[data-testid="add-course-title-input"]').setValue("  Web Lanjut  ");
    await wrapper.find('[data-testid="add-course-description-input"]').setValue("  Belajar web  ");
    wrapper.find("form").element.dispatchEvent(new Event("submit", { cancelable: true }));
    await tick();

    expect(addSpy).toHaveBeenCalledWith("Web Lanjut", "Belajar web");
    expect(wrapper.text()).toContain("Menyimpan...");

    coursesStore.setIsCourseAdd(true);
    coursesStore.setIsCourseAdded(true);
    await tick();

    expect(reloadSpy).toHaveBeenCalled();
    expect(closeSpy).toHaveBeenCalled();
    expect(wrapper.text()).not.toContain("Menyimpan...");
    expect(wrapper.find('[data-testid="add-course-title-input"]').element.value).toBe("");
    expect(wrapper.find('[data-testid="add-course-description-input"]').element.value).toBe("");
  });

  it("should stay open and stop loading when add fails", async () => {
    const closeSpy = vi.fn();
    const { wrapper, coursesStore } = renderWithProviders(AddModal, { props: { show: true, onClose: closeSpy } });
    vi.spyOn(coursesStore, "asyncSetIsCourseAdd").mockResolvedValue();

    await wrapper.find('[data-testid="add-course-title-input"]').setValue("A");
    await wrapper.find('[data-testid="add-course-description-input"]').setValue("B");
    wrapper.find("form").element.dispatchEvent(new Event("submit", { cancelable: true }));
    await tick();

    coursesStore.setIsCourseAdd(true);
    await tick();

    expect(closeSpy).not.toHaveBeenCalled();
    expect(wrapper.text()).not.toContain("Menyimpan...");
  });

  it("should close from both buttons, with or without onClose", async () => {
    const closeSpy = vi.fn();
    const a = renderWithProviders(AddModal, { props: { show: true, onClose: closeSpy } });
    a.wrapper.find('[data-testid="close-add-modal-btn"]').element.click();
    a.wrapper.find('[data-testid="cancel-add-modal-btn"]').element.click();
    expect(closeSpy).toHaveBeenCalledTimes(2);
    a.wrapper.unmount();

    const b = renderWithProviders(AddModal, { props: { show: true } });
    expect(() => b.wrapper.find('[data-testid="close-add-modal-btn"]').element.click()).not.toThrow();
  });
});
