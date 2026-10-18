<script lang="ts">
  import { goto } from "$app/navigation";
  import { usersStore } from "../../users/states/usersStore";

  $: if ($usersStore.isProfile) {
    const profile = $usersStore.profile;
    usersStore.setIsProfile(false);
    if (profile) {
      goto("/");
    }
  }
</script>
