import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  { ignores: [".next/**", "node_modules/**", "lib/db/migrations/**"] },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];
