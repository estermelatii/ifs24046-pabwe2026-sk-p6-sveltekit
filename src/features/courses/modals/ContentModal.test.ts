import { describe, it, expect, vi, beforeEach } from "vitest";
import ContentModal from "./ContentModal.svelte";
import { renderWithProviders } from "../../../test-utils";
import * as toolsHelper from "../../../helpers/toolsHelper";

const tick = () => new Promise((r) => setTimeout(r, 10));
const content: any = { id: 7, title: "Intro", youtube: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" };
const submit = (wrapper: any) =>
  wrapper.find("form").element.dispatchEvent(new Event("submit", { cancelable: true }));

async function fill(wrapper: any, title: string, youtube: string) {
  await wrapper.find('[data-testid="content-title-input"]').setValue(title);
  await wrapper.find('[data-testid="content-youtube-input"]').setValue(youtube);
}

describe("ContentModal", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should not render when show is false", () => {
    const { wrapper } = renderWithProviders(ContentModal, { props: { show: false, courseId: 1 } });
    expect(wrapper.find('[data-testid="content-modal"]').exists()).toBe(false);
    expect(document.body.style.overflow).toBe("auto");
  });

  it("should render add mode with an empty form", () => {
    const { wrapper } = renderWithProviders(ContentModal, { props: { show: true, courseId: 1 } });
    expect(wrapper.find('[data-testid="content-modal-title"]').text().trim()).toBe("Tambah Konten");
    expect(wrapper.find('[data-testid="content-title-input"]').element.value).toBe("");
    expect(wrapper.find('[data-testid="content-youtube-input"]').element.value).toBe("");
    expect(wrapper.text()).toContain("Simpan Konten");
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("should render edit mode prefilled with the content", () => {
    const { wrapper } = renderWithProviders(ContentModal, { props: { show: true, courseId: 1, content } });
    expect(wrapper.find('[data-testid="content-modal-title"]').text().trim()).toBe("Ubah Konten");
    expect(wrapper.find('[data-testid="content-title-input"]').element.value).toBe("Intro");
    expect(wrapper.find('[data-testid="content-youtube-input"]').element.value).toBe(content.youtube);
    expect(wrapper.text()).toContain("Perbarui Konten");
  });

  it("should use empty strings when the content lacks title and youtube", () => {
    const { wrapper } = renderWithProviders(ContentModal, { props: { show: true, courseId: 1, content: { id: 1 } } });
    expect(wrapper.find('[data-testid="content-title-input"]').element.value).toBe("");
    expect(wrapper.find('[data-testid="content-youtube-input"]').element.value).toBe("");
  });

  it("should validate title, link presence, and YouTube format", async () => {
    const errorSpy = vi.spyOn(toolsHelper, "showErrorDialog").mockResolvedValue(undefined as any);
    const { wrapper, coursesStore } = renderWithProviders(ContentModal, { props: { show: true, courseId: 1 } });
    const addSpy = vi.spyOn(coursesStore, "asyncSetIsContentAdd").mockResolvedValue();

    submit(wrapper);
    await tick();
    expect(errorSpy).toHaveBeenLastCalledWith("Judul konten tidak boleh kosong");

    await fill(wrapper, "Intro", "   ");
    submit(wrapper);
    await tick();
    expect(errorSpy).toHaveBeenLastCalledWith("Tautan YouTube tidak boleh kosong");

    await fill(wrapper, "Intro", "https://vimeo.com/123456789");
    submit(wrapper);
    await tick();
    expect(errorSpy).toHaveBeenLastCalledWith("Tautan harus berupa URL video YouTube yang valid");

    expect(addSpy).not.toHaveBeenCalled();
  });

  it("should add a content, then reload the course and close on success", async () => {
    const closeSpy = vi.fn();
    const { wrapper, coursesStore } = renderWithProviders(ContentModal, {
      props: { show: true, courseId: 3, onClose: closeSpy },
    });
    const addSpy = vi.spyOn(coursesStore, "asyncSetIsContentAdd").mockResolvedValue();
    const detailSpy = vi.spyOn(coursesStore, "asyncSetCourse").mockResolvedValue();

    await fill(wrapper, "  Intro ", " https://youtu.be/dQw4w9WgXcQ ");
    submit(wrapper);
    await tick();

    expect(addSpy).toHaveBeenCalledWith(3, "Intro", "https://youtu.be/dQw4w9WgXcQ");
    expect(wrapper.text()).toContain("Menyimpan...");

    coursesStore.setIsContentAdd(true);
    coursesStore.setIsContentAdded(true);
    await tick();

    expect(detailSpy).toHaveBeenCalledWith(3);
    expect(closeSpy).toHaveBeenCalled();
  });

  it("should stay open when adding fails", async () => {
    const closeSpy = vi.fn();
    const { wrapper, coursesStore } = renderWithProviders(ContentModal, {
      props: { show: true, courseId: 3, onClose: closeSpy },
    });
    vi.spyOn(coursesStore, "asyncSetIsContentAdd").mockResolvedValue();

    await fill(wrapper, "Intro", "https://youtu.be/dQw4w9WgXcQ");
    submit(wrapper);
    coursesStore.setIsContentAdd(true);
    await tick();

    expect(closeSpy).not.toHaveBeenCalled();
    expect(wrapper.text()).not.toContain("Menyimpan...");
  });

  it("should update a content, then reload the course and close on success", async () => {
    const closeSpy = vi.fn();
    const { wrapper, coursesStore } = renderWithProviders(ContentModal, {
      props: { show: true, courseId: 3, content, onClose: closeSpy },
    });
    const changeSpy = vi.spyOn(coursesStore, "asyncSetIsContentChange").mockResolvedValue();
    const detailSpy = vi.spyOn(coursesStore, "asyncSetCourse").mockResolvedValue();

    await fill(wrapper, "Baru", "https://youtu.be/abcdefghijk");
    submit(wrapper);
    await tick();

    expect(changeSpy).toHaveBeenCalledWith(3, 7, "Baru", "https://youtu.be/abcdefghijk");

    coursesStore.setIsContentChange(true);
    coursesStore.setIsContentChanged(true);
    await tick();

    expect(detailSpy).toHaveBeenCalledWith(3);
    expect(closeSpy).toHaveBeenCalled();
  });

  it("should stay open when updating fails", async () => {
    const closeSpy = vi.fn();
    const { wrapper, coursesStore } = renderWithProviders(ContentModal, {
      props: { show: true, courseId: 3, content, onClose: closeSpy },
    });
    vi.spyOn(coursesStore, "asyncSetIsContentChange").mockResolvedValue();

    submit(wrapper);
    coursesStore.setIsContentChange(true);
    await tick();

    expect(closeSpy).not.toHaveBeenCalled();
    expect(wrapper.text()).not.toContain("Menyimpan...");
  });

  it("should close from both buttons, with or without onClose", () => {
    const closeSpy = vi.fn();
    const a = renderWithProviders(ContentModal, { props: { show: true, courseId: 1, onClose: closeSpy } });
    a.wrapper.find('[data-testid="close-content-modal-btn"]').element.click();
    a.wrapper.find('[data-testid="cancel-content-modal-btn"]').element.click();
    expect(closeSpy).toHaveBeenCalledTimes(2);
    a.wrapper.unmount();

    const b = renderWithProviders(ContentModal, { props: { show: true, courseId: 1 } });
    expect(() => b.wrapper.find('[data-testid="close-content-modal-btn"]').element.click()).not.toThrow();
  });
});
