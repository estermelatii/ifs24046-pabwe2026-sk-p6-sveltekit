<script lang="ts">
  import { onMount } from "svelte";
  import AddModal from "../modals/AddModal.svelte";
  import ChangeModal from "../modals/ChangeModal.svelte";
  import { coursesStore } from "../states/coursesStore";
  import { usersStore } from "../../users/states/usersStore";
  import { showConfirmDialog } from "../../../helpers/toolsHelper";
  import { averageRating, getRole, isOwner, type Id } from "../courseUtils";
  import {
    Plus,
    Search,
    Funnel,
    Trash2,
    Pencil,
    Users,
    Star,
    GraduationCap,
    LoaderCircle,
  } from "lucide-svelte";

  let loadingCourses: boolean = false;
  let onlyMine: boolean = false;
  let searchQuery: string = "";
  let showAddModal: boolean = false;
  let showChangeModal: boolean = false;
  let selectedCourseId: Id | null = null;

  $: profile = $usersStore.profile;
  $: courses = $coursesStore.courses || [];

  onMount(() => {
    loadCourses();
  });

  function loadCourses() {
    loadingCourses = true;
    Promise.resolve(coursesStore.asyncSetCourses()).finally(() => {
      loadingCourses = false;
    });
  }

  $: if ($coursesStore.isCourseDeleted) {
    coursesStore.setIsCourseDeleted(false);
    loadCourses();
  }

  $: if ($coursesStore.isCourseDeletedAll) {
    coursesStore.setIsCourseDeletedAll(false);
    loadCourses();
  }

  function handleEdit(courseId: Id) {
    selectedCourseId = courseId;
    showChangeModal = true;
  }

  async function handleDelete(courseId: Id) {
    const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus kursus ini?");
    if (result.isConfirmed) {
      coursesStore.asyncSetIsCourseDelete(courseId);
    }
  }

  async function handleDeleteAll() {
    const result = await showConfirmDialog(
      "Apakah Anda yakin ingin menghapus SEMUA kursus? Tindakan ini tidak dapat dibatalkan."
    );
    if (result.isConfirmed) {
      coursesStore.asyncSetIsCourseDeleteAll();
    }
  }

  $: filteredCourses = courses.filter((course) => {
    if (onlyMine && !isOwner(course, profile)) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const title = course.title ? course.title.toLowerCase() : "";
    const description = course.description ? course.description.toLowerCase() : "";
    return title.includes(q) || description.includes(q);
  });

  $: hasOwnCourses = courses.some((course) => isOwner(course, profile));
</script>

{#if profile}
  <div class="space-y-8 animate-in fade-in duration-300">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Daftar Kursus</h1>
        <p class="text-sm text-slate-600 mt-1">Temukan kursus, gabung, dan belajar lewat materi video.</p>
      </div>
      <div class="flex items-center gap-2 self-start sm:self-auto">
        {#if hasOwnCourses}
          <button
            type="button"
            data-testid="delete-all-btn"
            on:click={handleDeleteAll}
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-all"
          >
            <Trash2 size={18} />
            <span>Hapus Semua</span>
          </button>
        {/if}
        <button
          type="button"
          data-testid="add-course-btn"
          on:click={() => (showAddModal = true)}
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 shadow-md shadow-indigo-600/25 transition-all"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Tambah Kursus</span>
        </button>
      </div>
    </div>

    <!-- Controls -->
    <div class="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="relative flex-1 max-w-md">
        <Search size={18} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          data-testid="search-course-input"
          aria-label="Cari kursus"
          bind:value={searchQuery}
          placeholder="Cari judul atau deskripsi kursus..."
          class="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all"
        />
      </div>

      <div class="flex items-center gap-2.5">
        <span class="text-xs font-semibold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
          <Funnel size={16} /> Filter:
        </span>
        <div class="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-semibold text-slate-600">
          <button
            type="button"
            data-testid="filter-all-btn"
            aria-pressed={!onlyMine}
            on:click={() => (onlyMine = false)}
            class="px-3 py-1.5 rounded-lg transition-all {!onlyMine ? 'bg-white text-slate-900 shadow-xs' : 'hover:text-slate-900'}"
          >
            Semua
          </button>
          <button
            type="button"
            data-testid="filter-mine-btn"
            aria-pressed={onlyMine}
            on:click={() => (onlyMine = true)}
            class="px-3 py-1.5 rounded-lg transition-all {onlyMine ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'}"
          >
            Milik Saya
          </button>
        </div>
      </div>
    </div>

    <!-- Course grid -->
    {#if loadingCourses && filteredCourses.length === 0}
      <div class="py-16 text-center text-slate-600">
        <LoaderCircle size={36} class="mx-auto text-indigo-600 animate-spin mb-2" />
        <p class="font-medium">Memuat daftar kursus...</p>
      </div>
    {:else if filteredCourses.length === 0}
      <div class="py-16 text-center text-slate-600 bg-white rounded-2xl border border-dashed border-slate-200">
        <GraduationCap size={40} class="mx-auto text-slate-300 mb-2" />
        <p class="font-medium">Belum ada kursus yang cocok.</p>
      </div>
    {:else}
      <ul class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {#each filteredCourses as course (course.id)}
          {@const role = getRole(course, profile)}
          {@const average = averageRating(course)}
          <li
            data-testid={`course-card-${course.id}`}
            class="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col hover:shadow-md transition-shadow"
          >
            {#if course.cover}
              <img src={course.cover} alt="" class="h-40 w-full object-cover" />
            {:else}
              <div class="h-40 w-full bg-gradient-to-br from-indigo-600 to-cyan-700 flex items-center justify-center text-white">
                <GraduationCap size={44} />
              </div>
            {/if}

            <div class="p-5 flex-1 flex flex-col gap-3">
              <div class="flex items-start justify-between gap-2">
                <h2 class="font-bold text-slate-900 leading-snug">
                  <a
                    href={`/courses/${course.id}`}
                    data-testid={`view-course-${course.id}`}
                    class="hover:text-indigo-700 transition-colors"
                  >
                    {course.title}
                  </a>
                </h2>
                {#if role === "owner"}
                  <span class="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold border bg-indigo-50 text-indigo-700 border-indigo-200">Milik Saya</span>
                {:else if role === "student"}
                  <span class="shrink-0 px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200">Terdaftar</span>
                {/if}
              </div>

              <p class="text-sm text-slate-600 line-clamp-2">{course.description}</p>

              <div class="flex items-center gap-4 text-xs text-slate-600 mt-auto">
                <span class="inline-flex items-center gap-1.5">
                  <Users size={14} />
                  {(course.students || []).length} peserta
                </span>
                <span class="inline-flex items-center gap-1.5">
                  <Star size={14} />
                  {average > 0 ? average.toFixed(1) : "Belum ada rating"}
                </span>
              </div>

              {#if role === "owner"}
                <div class="flex items-center gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    data-testid={`edit-course-${course.id}`}
                    on:click={() => handleEdit(course.id)}
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                  >
                    <Pencil size={14} /> Ubah
                  </button>
                  <button
                    type="button"
                    data-testid={`delete-course-${course.id}`}
                    on:click={() => handleDelete(course.id)}
                    class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg text-red-700 bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 size={14} /> Hapus
                  </button>
                </div>
              {/if}
            </div>
          </li>
        {/each}
      </ul>
    {/if}

    <AddModal show={showAddModal} on:close={() => (showAddModal = false)} />
    <ChangeModal
      show={showChangeModal}
      courseId={selectedCourseId}
      on:close={() => (showChangeModal = false)}
    />
  </div>
{/if}
