<script lang="ts">
  import { Star } from "lucide-svelte";

  export let value: number = 0;
  export let disabled: boolean = false;
  export let onRate: ((rating: number) => void) | undefined = undefined;

  const stars = [1, 2, 3, 4, 5];

  function handleRate(rating: number) {
    if (onRate) onRate(rating);
  }
</script>

<div role="group" aria-label="Rating kursus" data-testid="star-rating" class="inline-flex items-center gap-1">
  {#each stars as n (n)}
    <button
      type="button"
      data-testid={`star-${n}`}
      aria-label={`Beri rating ${n} dari 5`}
      aria-pressed={n <= value}
      {disabled}
      on:click={() => handleRate(n)}
      class="p-1 rounded-lg transition-colors disabled:opacity-60 {n <= value ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'}"
    >
      <Star size={24} class={n <= value ? "fill-current" : ""} />
    </button>
  {/each}
</div>
