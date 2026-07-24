<<<<<<< HEAD
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
=======
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
>>>>>>> origin/main

export default defineConfig({
  plugins: [react()],
  test: {
<<<<<<< HEAD
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
  },
=======
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts']
  }
>>>>>>> origin/main
});
