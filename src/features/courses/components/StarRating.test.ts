import { describe, it, expect, vi } from "vitest";
import StarRating from "./StarRating.svelte";
import { renderWithProviders } from "../../../test-utils";

describe("StarRating", () => {
  it("should render five accessible star buttons", () => {
    const { wrapper } = renderWithProviders(StarRating, { props: { value: 0 } });
    const stars = wrapper.findAll("button");
    expect(stars.length).toBe(5);
    expect(stars[0].attributes("aria-label")).toBe("Beri rating 1 dari 5");
    expect(stars[4].attributes("aria-label")).toBe("Beri rating 5 dari 5");
    expect(wrapper.find('[role="group"]').attributes("aria-label")).toBe("Rating kursus");
  });

  it("should mark stars up to the current value as pressed", () => {
    const { wrapper } = renderWithProviders(StarRating, { props: { value: 3 } });
    const pressed = wrapper.findAll("button").map((b: any) => b.attributes("aria-pressed"));
    expect(pressed).toEqual(["true", "true", "true", "false", "false"]);
  });

  it("should call onRate with the clicked rating", () => {
    const onRate = vi.fn();
    const { wrapper } = renderWithProviders(StarRating, { props: { value: 1, onRate } });
    wrapper.find('[data-testid="star-4"]').element.click();
    expect(onRate).toHaveBeenCalledWith(4);
  });

  it("should not fail when no onRate handler is given", () => {
    const { wrapper } = renderWithProviders(StarRating, { props: { value: 0 } });
    expect(() => wrapper.find('[data-testid="star-2"]').element.click()).not.toThrow();
  });

  it("should disable all stars when disabled", () => {
    const { wrapper } = renderWithProviders(StarRating, { props: { disabled: true } });
    expect(wrapper.findAll("button").every((b: any) => b.element.disabled)).toBe(true);
  });
});
