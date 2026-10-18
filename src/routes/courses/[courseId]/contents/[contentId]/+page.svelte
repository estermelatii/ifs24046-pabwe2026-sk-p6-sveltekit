<script lang="ts">
  import { page } from "$app/state";
  import ContentPage from "../../../../../features/courses/pages/ContentPage.svelte";

  let courseId = $derived(page.params.courseId);
  let contentId = $derived(page.params.contentId);
</script>

<ContentPage {courseId} {contentId} />
