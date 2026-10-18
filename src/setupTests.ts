import "@testing-library/jest-dom";
import { vi, afterEach } from "vitest";
import { cleanup } from "@testing-library/svelte";
import { writable } from "svelte/store";

afterEach(() => {
  cleanup();
});

if (typeof document !== "undefined") {
  if (!document.elementFromPoint) {
    document.elementFromPoint = () => null;
  }
  if (!Range.prototype.getClientRects) {
    Range.prototype.getClientRects = () => [] as unknown as DOMRectList;
  }
  if (!Range.prototype.getBoundingClientRect) {
    Range.prototype.getBoundingClientRect = () => ({
      bottom: 0,
      height: 0,
      left: 0,
      right: 0,
      top: 0,
      width: 0,
      x: 0,
      y: 0,
      toJSON: () => {},
    });
  }
}

if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

if (typeof (globalThis as any).DELCOM_BASEURL === "undefined") {
  (globalThis as any).DELCOM_BASEURL = "https://open-api.delcom.org/api/v1";
}

import * as $ from "svelte/internal/client";

function DummyIcon(anchor: any, props: any) {
  let el: HTMLElement | null = null;
  if (typeof document !== "undefined") {
    el = document.createElement("span");
    el.setAttribute("data-testid", "icon");
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(el, anchor);
    }
  }
  if (props) {
    try {
      ($.render_effect as any)(() => {
        for (const key of Object.getOwnPropertyNames(props)) {
          const val = props[key];
          if (el && key === "class" && val) {
            el.className = String(val);
          }
        }
      });
    } catch {
      for (const key of Object.getOwnPropertyNames(props)) {
        try {
          const val = props[key];
          if (el && key === "class" && val) el.className = String(val);
        } catch {}
      }
    }
  }
  return {};
}

vi.mock("lucide-svelte", async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, any>;
  const mocked: Record<string, any> = {};
  for (const key of Object.keys(actual)) {
    mocked[key] = DummyIcon;
  }
  return {
    ...actual,
    ...mocked,
    default: mocked,
  };
});

vi.mock("@toast-ui/editor", () => {
  return {
    default: vi.fn().mockImplementation(function (this: any, options: any) {
      let markdown = options?.initialValue || "";
      this.options = options;
      this.getMarkdown = vi.fn(() => markdown);
      this.setMarkdown = vi.fn((val: string) => {
        markdown = val;
      });
      this.destroy = vi.fn();
    }),
  };
});

vi.mock("@toast-ui/editor/dist/toastui-editor-viewer", () => {
  return {
    default: vi.fn().mockImplementation(function (this: any, options: any) {
      let markdown = options?.initialValue || "";
      if (options?.el) {
        options.el.innerHTML = `<div class="toastui-editor-contents">${markdown}</div>`;
      }
      this.options = options;
      this.setMarkdown = vi.fn((val: string) => {
        markdown = val;
        if (options?.el) {
          options.el.innerHTML = `<div class="toastui-editor-contents">${markdown}</div>`;
        }
      });
      this.destroy = vi.fn();
    }),
  };
});

function rune<T>(initial: T) {
  const source = $.state(initial);
  return {
    get value() {
      return $.get(source) as T;
    },
    set value(next: T) {
      $.set(source, next);
    },
  };
}

const pageUrl = rune(new URL("http://localhost:3000/"));
const pageParams = rune({} as Record<string, string>);
const pageRoute = rune({ id: "/" });
const pageStatus = rune(200);
const pageError = rune(null as any);
const pageData = rune({} as Record<string, any>);
const pageForm = rune(undefined as any);

export const mockPageState = {
  get url() {
    return pageUrl.value;
  },
  set url(value: URL) {
    pageUrl.value = value;
  },
  get params() {
    return pageParams.value;
  },
  set params(value: Record<string, string>) {
    pageParams.value = value;
  },
  get route() {
    return pageRoute.value;
  },
  set route(value: { id: string }) {
    pageRoute.value = value;
  },
  get status() {
    return pageStatus.value;
  },
  set status(value: number) {
    pageStatus.value = value;
  },
  get error() {
    return pageError.value;
  },
  set error(value: any) {
    pageError.value = value;
  },
  get data() {
    return pageData.value;
  },
  set data(value: Record<string, any>) {
    pageData.value = value;
  },
  get form() {
    return pageForm.value;
  },
  set form(value: any) {
    pageForm.value = value;
  },
};

export const mockPageStore = writable({
  url: pageUrl.value,
  params: pageParams.value,
  route: pageRoute.value,
  status: pageStatus.value,
  error: pageError.value,
  data: pageData.value,
  form: pageForm.value,
});

export function updateMockPage(data: Partial<typeof mockPageState>) {
  Object.assign(mockPageState, data);
  mockPageStore.set({
    url: mockPageState.url,
    params: mockPageState.params,
    route: mockPageState.route,
    status: mockPageState.status,
    error: mockPageState.error,
    data: mockPageState.data,
    form: mockPageState.form,
  });
}

export const mockGoto = vi.fn().mockImplementation((url: string) => {
  const currentUrl = new URL(url, "http://localhost:3000");
  updateMockPage({
    url: currentUrl,
    params: {},
    route: { id: currentUrl.pathname },
  });
  return Promise.resolve();
});

vi.mock("$app/navigation", () => ({
  goto: mockGoto,
  invalidate: vi.fn(),
  invalidateAll: vi.fn(),
  beforeNavigate: vi.fn(),
  afterNavigate: vi.fn(),
  pushState: vi.fn(),
  replaceState: vi.fn(),
}));

vi.mock("$app/state", () => ({
  page: mockPageState,
  navigating: null,
  updated: false,
}));

vi.mock("$app/stores", () => ({
  page: {
    subscribe: mockPageStore.subscribe,
  },
  navigating: writable(null),
  updated: writable(false),
}));
