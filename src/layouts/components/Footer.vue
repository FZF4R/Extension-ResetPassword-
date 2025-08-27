<template>
  <div class="h-100 d-flex align-center justify-space-between">
    <!-- 👉 Footer: left content -->
    <span class="d-flex align-center">
      &copy;
      {{ new Date().getFullYear() }}
      Made By

      <a
        target="_blank"
        rel="noopener noreferrer"
        class="text-primary ms-1"
      >Hung Vu</a>
    </span>
    <!-- 👉 Footer: right content -->
    <span class="d-md-flex gap-x-4 text-primary d-none">
      <a
        target="noopener noreferrer"
      >Version 1.1.0</a>
    </span>
  </div>
</template>
