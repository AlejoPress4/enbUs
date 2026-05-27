<script setup>
const { data, error } = await useFetch('/api/version');
</script>

<template>
  <div>
    <h1>Database Version</h1>
    <p v-if="data">{{ data.version }}</p>
    <p v-else-if="error">Error fetching version</p>
  </div>
</template>
