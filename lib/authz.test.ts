import { describe, expect, it } from "vitest";
import { assertOwner, canSee, Forbidden, type Viewer } from "./authz";

const alice: Viewer = { id: "a" };
const bob: Viewer = { id: "b" };
const anon: Viewer = null;

describe("canSee", () => {
  it("anyone sees public rows", () => {
    expect(canSee(anon, { userId: "a", visibility: "public" })).toBe(true);
    expect(canSee(bob, { userId: "a", visibility: "public" })).toBe(true);
  });

  it("nobody but the owner sees private rows", () => {
    expect(canSee(alice, { userId: "a", visibility: "private" })).toBe(true);
    expect(canSee(bob, { userId: "a", visibility: "private" })).toBe(false);
    expect(canSee(anon, { userId: "a", visibility: "private" })).toBe(false);
  });

  it("a private row does not leak to a follower", () => {
    // the exact bug that leaks a database. it stays tested forever.
    expect(canSee(bob, { userId: "a", visibility: "private" }, true)).toBe(false);
  });

  it("followers-only rows need an accepted follow", () => {
    expect(canSee(bob, { userId: "a", visibility: "followers" }, true)).toBe(true);
    expect(canSee(bob, { userId: "a", visibility: "followers" }, false)).toBe(false);
    expect(canSee(anon, { userId: "a", visibility: "followers" }, true)).toBe(false);
  });
});

describe("assertOwner", () => {
  it("lets the owner through", () => {
    expect(() => assertOwner(alice, { userId: "a" })).not.toThrow();
  });

  it("stops a logged-in stranger who guessed the id", () => {
    expect(() => assertOwner(bob, { userId: "a" })).toThrow(Forbidden);
  });

  it("stops anonymous", () => {
    expect(() => assertOwner(anon, { userId: "a" })).toThrow(Forbidden);
  });
});
