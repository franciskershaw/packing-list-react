import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

import "@testing-library/jest-dom/vitest";

// @testing-library/react's own auto-cleanup relies on detecting a
// *global* afterEach, which doesn't exist here (vite.config.ts doesn't
// set test.globals — each file imports afterEach from "vitest"
// explicitly instead), so it silently never registers. Without this,
// DOM from one test leaks into the next whenever a file calls render()
// more than once across separate test cases.
afterEach(cleanup);
