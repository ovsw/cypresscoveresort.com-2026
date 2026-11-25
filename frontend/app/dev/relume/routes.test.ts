import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const notFound = vi.hoisted(() =>
  vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
);
const refresh = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ notFound, useRouter: vi.fn() }));
vi.mock("next/server", () => ({ connection: vi.fn(async () => undefined) }));
vi.mock("next/cache", () => ({ refresh }));

import IndexPage from "./page";
import CategoryPage from "./[category]/page";
import { setRelumeDecision } from "./actions";

let root: string;

beforeEach(() => {
  root = mkdtempSync(path.join(os.tmpdir(), "relume-routes-"));
  writeFileSync(path.join(root, "pnpm-workspace.yaml"), "packages: []\n");
  mkdirSync(path.join(root, "relume"));
  vi.spyOn(process, "cwd").mockReturnValue(root);
  notFound.mockClear();
  refresh.mockClear();
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  rmSync(root, { recursive: true, force: true });
});

const categoryProps = {
  params: Promise.resolve({ category: "feature-sections" }),
  searchParams: Promise.resolve({}),
};

describe("outside development", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "production");
  });

  it("/dev/relume returns 404", async () => {
    await expect(IndexPage()).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });

  it("/dev/relume/<category> returns 404", async () => {
    await expect(CategoryPage(categoryProps)).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });

  it("the decision action refuses and writes nothing", async () => {
    await expect(setRelumeDecision("layout16", "want")).resolves.toEqual({
      ok: false,
      error: expect.stringMatching(/next dev/),
    });
    expect(existsSync(path.join(root, "relume", "decisions.json"))).toBe(false);
    expect(refresh).not.toHaveBeenCalled();
  });
});

describe("in development", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
  });

  it("renders the index without a 404 when the inventory is missing", async () => {
    await expect(IndexPage()).resolves.toBeTruthy();
    expect(notFound).not.toHaveBeenCalled();
  });

  it("the decision action writes decisions.json and refreshes the page", async () => {
    await expect(setRelumeDecision("layout16", "want")).resolves.toEqual({
      ok: true,
      slug: "layout16",
      decision: "want",
    });
    expect(readFileSync(path.join(root, "relume", "decisions.json"), "utf8")).toBe(
      '{\n  "layout16": "want"\n}\n',
    );
    expect(refresh).toHaveBeenCalledOnce();

    await setRelumeDecision("layout16", null);
    expect(readFileSync(path.join(root, "relume", "decisions.json"), "utf8")).toBe("{}\n");
  });

  it("the decision action rejects a malformed slug", async () => {
    await expect(setRelumeDecision("../x", "want")).resolves.toMatchObject({ ok: false });
  });
});
