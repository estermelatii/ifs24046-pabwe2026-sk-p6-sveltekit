<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import ChangeCoverModal from "../modals/ChangeCoverModal.svelte";
  import ChangeModal from "../modals/ChangeModal.svelte";
  import ContentModal from "../modals/ContentModal.svelte";
  import StarRating from "../components/StarRating.svelte";
  import { coursesStore } from "../states/coursesStore";
  import { usersStore } from "../../users/states/usersStore";
  import { formatDate, showConfirmDialog } from "../../../helpers/toolsHelper";
  import {
    averageRating,
    getRole,
    isLearned,
    myRating,
    studentId,
    type CourseContent,
    type Id,
    type StudentRef,
  } from "../courseUtils";
  import {
    ArrowLeft,
    ImagePlus,
    PenLine,
    Plus,
    Pencil,
    Trash2,
    Calendar,
    Users,
    Star,
    Video,
    UserPlus,
    UserMinus,
    CircleCheck,
    Lock,
  } from "lucide-svelte";

  export let courseId: Id;

  $: profile = $usersStore.profile;
  $: course = $coursesStore.course;
  $: role = getRole(course, profile);
  $: contents = course?.contents || [];
  $: students = course?.students || [];
  $: average = averageRating(course);
  $: ownRating = myRating(course, profile);

  let showCoverModal: boolean = false;
  let showEditModal: boolean = false;
  let showContentModal: boolean = false;
  let selectedContent: CourseContent | null = null;

  onMount(() => {
    if (courseId) {
      coursesStore.asyncSetCourse(courseId);
    }
  });

  let prevId = courseId;
  $: if (courseId !== prevId) {
    prevId = courseId;
    coursesStore.asyncSetCourse(courseId);
  }

  function reloadAfter(done: boolean, reset: (value: boolean) => void) {
    if (done) {
      reset(false);
      coursesStore.asyncSetCourse(courseId);
    }
  }

  $: if ($coursesStore.isCourse) {
    coursesStore.setIsCourse(false);
    if (!course) {
      goto("/");
    }
  }

  $: if ($coursesStore.isCourseDeleted) {
    coursesStore.setIsCourseDeleted(false);
    goto("/");
  }

  $: if ($coursesStore.isStudentJoin) {
    coursesStore.setIsStudentJoin(false);
    reloadAfter($coursesStore.isStudentJoined, coursesStore.setIsStudentJoined);
  }

  $: if ($coursesStore.isStudentLeave) {
    coursesStore.setIsStudentLeave(false);
    reloadAfter($coursesStore.isStudentLeft, coursesStore.setIsStudentLeft);
  }

  $: if ($coursesStore.isRatingChange) {
    coursesStore.setIsRatingChange(false);
    reloadAfter($coursesStore.isRatingChanged, coursesStore.setIsRatingChanged);
  }

  $: if ($coursesStore.isContentDeleted) {
    coursesStore.setIsContentDeleted(false);
    coursesStore.asyncSetCourse(courseId);
  }

  async function handleDelete() {
    const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus kursus ini?");
    if (result.isConfirmed && course) {
      coursesStore.asyncSetIsCourseDelete(course.id);
    }
  }

  function handleJoin() {
    coursesStore.asyncSetIsStudentJoin(courseId);
  }

  async function handleLeave() {
    const result = await showConfirmDialog("Apakah Anda yakin ingin keluar dari kursus ini?");
    if (result.isConfirmed) {
      coursesStore.asyncSetIsStudentLeave(courseId);
    }
  }

  function handleRate(rating: number) {
    coursesStore.asyncSetIsRatingChange(courseId, rating);
  }

  function handleAddContent() {
    selectedContent = null;
    showContentModal = true;
  }

  function handleEditContent(content: CourseContent) {
    selectedContent = content;
    showContentModal = true;
  }

  async function handleDeleteContent(content: CourseContent) {
    const result = await showConfirmDialog("Apakah Anda yakin ingin menghapus konten ini?");
    if (result.isConfirmed) {
      coursesStore.asyncSetIsContentDelete(courseId, content.id);
    }
  }

  function studentLabel(student: StudentRef): string {
    return typeof student === "object" && student.name ? student.name : `Peserta #${studentId(student)}`;
  }
</script>

{#if !profile || !course}
  <div class="flex flex-col items-center justify-center py-20">
    <h1 class="sr-only">Memuat detail kursus</h1>
    <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
{:else}
  <div class="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
    <!-- Back & actions -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <a
        href="/"
        data-testid="back-to-courses-link"
        class="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-700 transition-colors"
      >
        <ArrowLeft size={18} />
        Kembali ke Kursus
      </a>

      <div class="flex flex-wrap items-center gap-2">
        {#if role === "owner"}
          <button
            type="button"
            data-testid="edit-cover-btn"
            on:click={() => (showCoverModal = true)}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/60 transition-colors"
          >
            <ImagePlus size={16} />
            Ubah Sampul
          </button>
          <button
            type="button"
            data-testid="edit-detail-course-btn"
            on:click={() => (showEditModal = true)}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/60 transition-colors"
          >
            <PenLine size={16} />
            Ubah Data
          </button>
          <button
            type="button"
            data-testid="delete-detail-course-btn"
            on:click={handleDelete}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors"
          >
            <Trash2 size={16} />
            Hapus
          </button>
        {:else if role === "student"}
          <button
            type="button"
            data-testid="leave-course-btn"
            on:click={handleLeave}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/60 transition-colors"
          >
            <UserMinus size={16} />
            Keluar dari Kursus
          </button>
        {:else}
          <button
            type="button"
            data-testid="join-course-btn"
            on:click={handleJoin}
            class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-colors"
          >
            <UserPlus size={16} />
            Gabung Kursus
          </button>
        {/if}
      </div>
    </div>

    <!-- Detail card -->
    <div class="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
      {#if course.cover}
        <div class="relative w-full h-56 sm:h-72 bg-slate-900 overflow-hidden">
          <img src={course.cover} alt="" class="w-full h-full object-cover" />
        </div>
      {/if}

      <div class="p-6 sm:p-8 space-y-6">
        <div class="space-y-3">
          <div class="flex flex-wrap items-center gap-3">
            <span class="font-mono text-xs font-bold text-slate-600">{"#" + course.id}</span>
            <span
              data-testid="role-badge"
              class="px-2.5 py-1 rounded-full text-xs font-semibold border {role === 'owner' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : role === 'student' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-700 border-slate-200'}"
            >
              {role === "owner" ? "Pemilik" : role === "student" ? "Peserta" : "Belum Bergabung"}
            </span>
          </div>

          <h1 class="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{course.title}</h1>

          <div class="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-slate-600">
            <span class="inline-flex items-center gap-1.5">
              <Users size={14} />
              <span data-testid="student-count">{students.length}</span> peserta
            </span>
            <span class="inline-flex items-center gap-1.5">
              <Star size={14} />
              <span data-testid="average-rating">{average > 0 ? average.toFixed(1) : "Belum ada rating"}</span>
            </span>
            <span class="inline-flex items-center gap-1.5">
              <Calendar size={14} class="shrink-0" />
              Dibuat: <strong class="text-slate-700">{formatDate(course.created_at)}</strong>
            </span>
            <span class="inline-flex items-center gap-1.5">
              <Calendar size={14} class="shrink-0" />
              Diperbarui: <strong class="text-slate-700">{formatDate(course.updated_at)}</strong>
            </span>
          </div>
        </div>

        <div
          data-testid="course-detail-description"
          class="text-slate-700 bg-slate-50/60 p-6 rounded-2xl border border-slate-100 leading-relaxed whitespace-pre-line"
        >
          {#if course.description}
            {course.description}
          {:else}
            <p class="italic text-slate-600">Tidak ada deskripsi untuk kursus ini.</p>
          {/if}
        </div>

        <!-- Rating (peserta) -->
        {#if role === "student"}
          <section class="space-y-2">
            <h2 class="text-lg font-bold text-slate-800">Beri Rating</h2>
            <StarRating value={ownRating} onRate={handleRate} />
          </section>
        {/if}

        <!-- Peserta (pemilik) -->
        {#if role === "owner"}
          <section class="space-y-2" data-testid="students-section">
            <h2 class="text-lg font-bold text-slate-800">Peserta (<span>{students.length}</span>)</h2>
            {#if students.length === 0}
              <p class="text-sm text-slate-600">Belum ada peserta yang bergabung.</p>
            {:else}
              <ul class="flex flex-wrap gap-2">
                {#each students as student (studentId(student))}
                  <li class="px-3 py-1.5 rounded-full bg-slate-100 text-xs font-medium text-slate-700">
                    {studentLabel(student)}
                  </li>
                {/each}
              </ul>
            {/if}
          </section>
        {/if}

        <!-- Konten -->
        <section class="space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-bold text-slate-800">Daftar Konten (<span>{contents.length}</span>)</h2>
            {#if role === "owner"}
              <button
                type="button"
                data-testid="add-content-btn"
                on:click={handleAddContent}
                class="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/25 transition-colors"
              >
                <Plus size={16} />
                Tambah Konten
              </button>
            {/if}
          </div>

          {#if role === "guest"}
            <div data-testid="contents-locked" class="py-10 text-center text-slate-600 border border-dashed border-slate-200 rounded-2xl">
              <Lock size={32} class="mx-auto text-slate-300 mb-2" />
              <p class="text-sm font-medium">Gabung ke kursus untuk mengakses materi.</p>
            </div>
          {:else if contents.length === 0}
            <div data-testid="contents-empty" class="py-10 text-center text-slate-600 border border-dashed border-slate-200 rounded-2xl">
              <Video size={32} class="mx-auto text-slate-300 mb-2" />
              <p class="text-sm font-medium">Belum ada konten.</p>
            </div>
          {:else}
            <ul class="space-y-2">
              {#each contents as content (content.id)}
                <li
                  data-testid={`content-row-${content.id}`}
                  class="flex items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200/80 bg-white hover:bg-slate-50/70 transition-colors"
                >
                  <a
                    href={`/courses/${course.id}/contents/${content.id}`}
                    data-testid={`open-content-${content.id}`}
                    class="min-w-0 flex items-center gap-3 group"
                  >
                    <div class="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
                      <Video size={16} />
                    </div>
                    <p class="font-semibold text-slate-800 truncate group-hover:text-indigo-700">{content.title}</p>
                    {#if isLearned(content)}
                      <span
                        data-testid={`learned-badge-${content.id}`}
                        class="inline-flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                      >
                        <CircleCheck size={12} /> Selesai
                      </span>
                    {/if}
                  </a>
                  {#if role === "owner"}
                    <div class="inline-flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        data-testid={`edit-content-${content.id}`}
                        aria-label={`Ubah konten ${content.title}`}
                        on:click={() => handleEditContent(content)}
                        class="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        data-testid={`delete-content-${content.id}`}
                        aria-label={`Hapus konten ${content.title}`}
                        on:click={() => handleDeleteContent(content)}
                        class="p-1.5 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  {/if}
                </li>
              {/each}
            </ul>
          {/if}
        </section>
      </div>
    </div>

    <ChangeCoverModal
      show={showCoverModal}
      {course}
      onClose={() => (showCoverModal = false)}
      on:close={() => (showCoverModal = false)}
    />

    <ChangeModal
      show={showEditModal}
      courseId={course.id}
      onClose={() => (showEditModal = false)}
      on:close={() => (showEditModal = false)}
    />

    <ContentModal
      show={showContentModal}
      courseId={course.id}
      content={selectedContent}
      onClose={() => (showContentModal = false)}
      on:close={() => (showContentModal = false)}
    />
  </div>
{/if}
