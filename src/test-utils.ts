import { render } from "@testing-library/svelte";
import { authStore } from "./features/auth/states/authStore";
import { usersStore } from "./features/users/states/usersStore";
import { coursesStore } from "./features/courses/states/coursesStore";
import { mockPageStore, mockGoto, updateMockPage } from "./setupTests";

export function setupMockStores(initialState: Record<string, any> = {}) {
  if (typeof (authStore as any).reset === "function") {
    (authStore as any).reset();
  }
  if (typeof (usersStore as any).reset === "function") {
    (usersStore as any).reset();
  }
  if (typeof (coursesStore as any).reset === "function") {
    (coursesStore as any).reset();
  }

  Object.entries(initialState).forEach(([key, val]) => {
    if ((authStore as any).$state && key in (authStore as any).$state) {
      (authStore as any).$state[key] = val;
      const setter = `set${key.charAt(0).toUpperCase() + key.slice(1)}`;
      if (typeof (authStore as any)[setter] === "function") {
        (authStore as any)[setter](val);
      }
    }
    if ((usersStore as any).$state && key in (usersStore as any).$state) {
      (usersStore as any).$state[key] = val;
      const setter = `set${key.charAt(0).toUpperCase() + key.slice(1)}`;
      if (typeof (usersStore as any)[setter] === "function") {
        (usersStore as any)[setter](val);
      }
    }
    if ((coursesStore as any).$state && key in (coursesStore as any).$state) {
      (coursesStore as any).$state[key] = val;
      const setter = `set${key.charAt(0).toUpperCase() + key.slice(1)}`;
      if (typeof (coursesStore as any)[setter] === "function") {
        (coursesStore as any)[setter](val);
      }
    }
  });

  return { authStore, usersStore, coursesStore };
}

export function createMockPinia(initialState: Record<string, any> = {}) {
  return setupMockStores(initialState);
}

export interface RenderWithProvidersOptions {
  props?: Record<string, any>;
  preloadedState?: Record<string, any>;
  route?: string;
  params?: Record<string, string>;
  pinia?: any;
  [key: string]: any;
}

export function renderWithProviders(
  component: any,
  {
    props = {},
    preloadedState = {},
    route = "/",
    params = {},
    ...options
  }: RenderWithProvidersOptions = {}
) {
  const { authStore: a, usersStore: u, coursesStore: t } = setupMockStores(preloadedState);
  if (route) {
    const url = new URL(route, "http://localhost:3000");
    updateMockPage({
      url,
      params,
      route: { id: url.pathname },
      status: 200,
      error: null,
      data: {},
      form: undefined,
    });
  }

  const result = render(component, { props, ...options });

  const createWrapperElement = (el: Element | null): any => {
    if (!el) {
      return {
        exists: () => false,
        element: null,
        trigger: async () => {},
        setValue: async () => {},
        text: () => "",
        attributes: () => undefined,
        find: () => createWrapperElement(null),
        findAll: () => [],
      };
    }
    return {
      exists: () => true,
      element: el,
      trigger: async (event: string, eventInit: any = {}) => {
        let ev: Event;
        if (event.startsWith("key")) {
          ev = new KeyboardEvent(event, { bubbles: true, cancelable: true, ...eventInit });
        } else if (event.startsWith("mouse") || event === "click") {
          ev = new MouseEvent(event, { bubbles: true, cancelable: true, ...eventInit });
        } else {
          ev = new CustomEvent(event, { bubbles: true, cancelable: true, detail: eventInit });
        }
        el.dispatchEvent(ev);
        await new Promise((r) => setTimeout(r, 0));
      },
      setValue: async (value: string) => {
        (el as HTMLInputElement).value = value;
        el.dispatchEvent(new Event("input", { bubbles: true }));
        el.dispatchEvent(new Event("change", { bubbles: true }));
        await new Promise((r) => setTimeout(r, 0));
      },
      text: () => el.textContent || "",
      attributes: (attr: string) => el.getAttribute(attr),
      find: (sel: string) => createWrapperElement(el.querySelector(sel)),
      findAll: (sel: string) => Array.from(el.querySelectorAll(sel)).map(createWrapperElement),
    };
  };

  const wrapper = {
    exists: () => !!result.container.firstElementChild,
    element: result.container.firstElementChild,
    text: () => result.container.textContent || "",
    html: () => result.container.innerHTML,
    find: (selector: string) => createWrapperElement(result.container.querySelector(selector)),
    findAll: (selector: string) =>
      Array.from(result.container.querySelectorAll(selector)).map(createWrapperElement),
    unmount: result.unmount,
  };

  return {
    ...result,
    wrapper,
    authStore: a,
    usersStore: u,
    coursesStore: t,
    mockPageStore,
    mockGoto,
  };
}
