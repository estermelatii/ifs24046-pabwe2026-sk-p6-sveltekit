import { describe, it, expect, vi, beforeEach } from "vitest";
import ChangeModal from "./ChangeModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import courseApi from "../api/courseApi";
import * as toolsHelper from "../../../helpers/toolsHelper";

const tick = () => new Promise((r) => setTimeout(r, 10));
const existing: any = { id: 1, user_id: 1, title: "Lama", description: "Deskripsi lama" };
const submit = (wrapper: any) =>
  wrapper.find("form").element.dispatchEvent(new Event("submit", { cancelable: true }));

describe("ChangeModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should not render or fetch when show is false", () => {
    const fetchSpy = vi.spyOn(courseApi, "getCourseById");
    const { wrapper } = renderWithProviders(ChangeModal, { props: { show: false, courseId: 1 } });
    expect(wrapper.find('[data-testid="edit-course-modal"]').exists()).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(document.body.style.overflow).toBe("auto");
  });

  it("should not fetch when courseId is missing", () => {
    const fetchSpy = vi.spyOn(courseApi, "getCourseById");
    renderWithProviders(ChangeModal, { props: { show: true } });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("should show a spinner while fetching, then fill the form", async () => {
    let resolve: (v: any) => void = () => {};
    vi.spyOn(courseApi, "getCourseById").mockReturnValue(new Promise((r) => (resolve = r)));
    const { wrapper } = renderWithProviders(ChangeModal, { props: { show: true, courseId: 1 } });
    await tick();

    expect(wrapper.find('[data-testid="edit-course-title-input"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="submit-edit-modal-btn"]').element.disabled).toBe(true);

    resolve(existing);
    await tick();

    expect(wrapper.find('[data-testid="edit-course-title-input"]').element.value).toBe("Lama");
    expect(wrapper.find('[data-testid="edit-course-description-input"]').element.value).toBe("Deskripsi lama");
  });

  it("should use empty strings when fetched data has missing fields", async () => {
    vi.spyOn(courseApi, "getCourseById").mockResolvedValue({ id: 1 } as any);
    const { wrapper } = renderWithProviders(ChangeModal, { props: { show: true, courseId: 1 } });
    await tick();
    expect(wrapper.find('[data-testid="edit-course-title-input"]').element.value).toBe("");
    expect(wrapper.find('[data-testid="edit-course-description-input"]').element.value).toBe("");
  });

  it("should leave the form untouched when API returns nothing", async () => {
    vi.spyOn(courseApi, "getCourseById").mockResolvedValue(undefined);
    const { wrapper } = renderWithProviders(ChangeModal, { props: { show: true, courseId: 1 } });
    await tick();
    expect(wrapper.find('[data-testid="edit-course-title-input"]').element.value).toBe("");
  });

  it("should show an error and close when fetching fails", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockResolvedValue(undefined as any);
    vi.spyOn(courseApi, "getCourseById").mockRejectedValue(new Error("x"));
    const closeSpy = vi.fn();
    renderWithProviders(ChangeModal, { props: { show: true, courseId: 1, onClose: closeSpy } });
    await tick();

    expect(errorSpy).toHaveBeenCalledWith("Gagal mengambil data kursus");
    expect(closeSpy).toHaveBeenCalled();
  });

  it("should validate title and description", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockResolvedValue(undefined as any);
    vi.spyOn(courseApi, "getCourseById").mockResolvedValue({ id: 1, title: "", description: "" } as any);
    const { wrapper } = renderWithProviders(ChangeModal, { props: { show: true, courseId: 1 } });
    await tick();

    submit(wrapper);
    await tick();
    expect(errorSpy).toHaveBeenLastCalledWith("Judul tidak boleh kosong");

    await wrapper.find('[data-testid="edit-course-title-input"]').setValue("Baru");
    submit(wrapper);
    await tick();
    expect(errorSpy).toHaveBeenLastCalledWith("Deskripsi tidak boleh kosong");
  });

  it("should submit changes, then reload list and detail and close when changed", async () => {
    vi.spyOn(courseApi, "getCourseById").mockResolvedValue(existing);
    const closeSpy = vi.fn();
    const { wrapper, coursesStore } = renderWithProviders(ChangeModal, {
      props: { show: true, courseId: 1, onClose: closeSpy },
    });
    const changeSpy = vi.spyOn(coursesStore, "asyncSetIsCourseChange").mockResolvedValue();
    const listSpy = vi.spyOn(coursesStore, "asyncSetCourses").mockResolvedValue();
    const detailSpy = vi.spyOn(coursesStore, "asyncSetCourse").mockResolvedValue();
    await tick();

    await wrapper.find('[data-testid="edit-course-title-input"]').setValue(" Baru ");
    await wrapper.find('[data-testid="edit-course-description-input"]').setValue(" Desc Baru ");
    submit(wrapper);
    await tick();

    expect(changeSpy).toHaveBeenCalledWith(1, "Baru", "Desc Baru");
    expect(wrapper.text()).toContain("Menyimpan...");

    coursesStore.setIsCourseChange(true);
    coursesStore.setIsCourseChanged(true);
    await tick();

    expect(listSpy).toHaveBeenCalled();
    expect(detailSpy).toHaveBeenCalledWith(1);
    expect(closeSpy).toHaveBeenCalled();
  });

  it("should stay open when the change fails", async () => {
    vi.spyOn(courseApi, "getCourseById").mockResolvedValue(existing);
    const closeSpy = vi.fn();
    const { wrapper, coursesStore } = renderWithProviders(ChangeModal, {
      props: { show: true, courseId: 1, onClose: closeSpy },
    });
    vi.spyOn(coursesStore, "asyncSetIsCourseChange").mockResolvedValue();
    await tick();

    submit(wrapper);
    coursesStore.setIsCourseChange(true);
    await tick();

    expect(closeSpy).not.toHaveBeenCalled();
    expect(wrapper.text()).not.toContain("Menyimpan...");
  });

  it("should close from both buttons, with or without onClose", async () => {
    vi.spyOn(courseApi, "getCourseById").mockResolvedValue(existing);
    const closeSpy = vi.fn();
    const a = renderWithProviders(ChangeModal, { props: { show: true, courseId: 1, onClose: closeSpy } });
    await tick();
    a.wrapper.find('[data-testid="close-edit-modal-btn"]').element.click();
    a.wrapper.find('[data-testid="cancel-edit-modal-btn"]').element.click();
    expect(closeSpy).toHaveBeenCalledTimes(2);
    a.wrapper.unmount();

    const b = renderWithProviders(ChangeModal, { props: { show: true, courseId: 1 } });
    await tick();
    expect(() => b.wrapper.find('[data-testid="close-edit-modal-btn"]').element.click()).not.toThrow();
  });
});
