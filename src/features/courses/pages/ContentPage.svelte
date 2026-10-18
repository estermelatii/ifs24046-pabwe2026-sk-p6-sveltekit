<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { coursesStore } from "../states/coursesStore";
  import { usersStore } from "../../users/states/usersStore";
  import { getRole, isLearned, parseYoutubeId, type Id } from "../courseUtils";
  import { ArrowLeft, Video, CircleCheck, Circle, ExternalLink, Lock } from "lucide-svelte";

  export let courseId: Id;
  export let contentId: Id;

  $: profile = $usersStore.profile;
  $: course = $coursesStore.course;
  $: content = $coursesStore.content;
  $: role = getRole(course, profile);
  $: videoId = content ? parseYoutubeId(content.youtube) : null;
  $: learned = isLearned(content);

  onMount(() => {
    coursesStore.asyncSetCourse(courseId);
    coursesStore.asyncSetContent(contentId);
  });

  $: if ($coursesStore.isCourse) {
    coursesStore.setIsCourse(false);
    if (!course) {
      goto("/");
    }
  }

  $: if ($coursesStore.isContent) {
    coursesStore.setIsContent(false);
    if (!content) {
      goto(`/courses/${courseId}`);
    }
  }

  $: if ($coursesStore.isContentStatusChange) {
    coursesStore.setIsContentStatusChange(false);
    if ($coursesStore.isContentStatusChanged) {
      coursesStore.setIsContentStatusChanged(false);
      coursesStore.asyncSetContent(contentId);
    }
  }

  function handleToggleStatus() {
    coursesStore.asyncSetIsContentStatusChange(contentId, learned ? 0 : 1);
  }
</script>

{#if !profile || !course || !content}
  <div class="flex flex-col items-center justify-center py-20">
    <h1 class="sr-only">Memuat materi</h1>
    <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
{:else}
  <div class="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
    <a
      href={`/courses/${courseId}`}
      data-testid="back-to-course-link"
      class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-700 transition-colors"
    >
      <ArrowLeft size={18} />
      Kembali ke <span>{course.title}</span>
    </a>

    <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      {#if role === "guest"}
        <div data-testid="content-locked" class="p-10 text-center text-slate-600">
          <Lock size={36} class="mx-auto text-slate-300 mb-3" />
          <h1 class="text-xl font-bold text-slate-800 mb-1">{content.title}</h1>
          <p class="text-sm">Gabung ke kursus ini untuk menonton materi.</p>
        </div>
      {:else}
        {#if videoId}
          <div class="aspect-video w-full bg-slate-900">
            <iframe
              data-testid="youtube-player"
              title={`Video: ${content.title}`}
              src={`https://www.youtube.com/embed/${videoId}`}
              class="w-full h-full"
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>
        {:else}
          <div data-testid="video-fallback" class="p-10 text-center text-slate-600 bg-slate-50">
            <Video size={36} class="mx-auto text-slate-300 mb-3" />
            <p class="text-sm font-medium mb-2">Video tidak dapat ditampilkan.</p>
            <a
              href={content.youtube}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-700 hover:underline"
            >
              <ExternalLink size={14} /> Buka tautan
            </a>
          </div>
        {/if}

        <div class="p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
              <Video size={20} />
            </div>
            <h1 class="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">{content.title}</h1>
          </div>

          <button
            type="button"
            data-testid="toggle-status-btn"
            aria-pressed={learned}
            on:click={handleToggleStatus}
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl transition-colors {learned ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200' : 'text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25'}"
          >
            {#if learned}
              <CircleCheck size={18} />
              <span>Selesai Dipelajari</span>
            {:else}
              <Circle size={18} />
              <span>Tandai Selesai</span>
            {/if}
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}
