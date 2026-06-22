import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getUserSession,
  setUserSession,
  clearUserSession,
  getViewSession,
  setViewSession,
  clearViewSession,
} from "./session.js";
import type { UserInfo } from "../types.js";

const sampleUser: UserInfo = {
  name: "Suzy",
  role: "Admin",
  email: "suzy@clance.com",
  department: "IT",
};

describe("Session Helper", () => {
  beforeEach(() => {
    // Clear mock sessionStorage or in-memory fallback
    clearUserSession();
    clearViewSession();
  });

  it("should return null when no user session exists", () => {
    expect(getUserSession()).toBeNull();
  });

  it("should store and retrieve user session", () => {
    setUserSession(sampleUser);
    expect(getUserSession()).toEqual(sampleUser);
  });

  it("should clear user session", () => {
    setUserSession(sampleUser);
    clearUserSession();
    expect(getUserSession()).toBeNull();
  });

  it("should store and retrieve view session", () => {
    setViewSession("dashboard");
    expect(getViewSession()).toBe("dashboard");
  });

  it("should clear view session", () => {
    setViewSession("dashboard");
    clearViewSession();
    expect(getViewSession()).toBeNull();
  });
});
