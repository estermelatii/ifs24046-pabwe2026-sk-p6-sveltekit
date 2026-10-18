<script lang="ts">
  import type { Snippet } from "svelte";
  import "@fontsource-variable/plus-jakarta-sans/wght.css";
  import "../index.css";
  import { page } from "$app/state";
  import CourseLayout from "../features/courses/layouts/CourseLayout.svelte";

  let { children }: { children?: Snippet } = $props();
  let isAuthRoute = $derived(page.url.pathname.startsWith("/auth"));
</script>

{#if isAuthRoute}
  {@render children?.()}
{:else}
  <CourseLayout>
    {@render children?.()}
  </CourseLayout>
{/if}
