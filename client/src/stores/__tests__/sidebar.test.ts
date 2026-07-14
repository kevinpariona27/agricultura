import { describe, it, expect, beforeEach } from "vitest";
import { useSidebarStore } from "../sidebar.js";

beforeEach(() => {
  useSidebarStore.setState({ isOpen: false });
});

describe("Sidebar store", () => {
  describe("initial state", () => {
    it("isOpen defaults to false", () => {
      const state = useSidebarStore.getState();
      expect(state.isOpen).toBe(false);
    });
  });

  describe("toggle", () => {
    it("toggles isOpen from false to true", () => {
      const store = useSidebarStore.getState();
      store.toggle();

      const state = useSidebarStore.getState();
      expect(state.isOpen).toBe(true);
    });

    it("toggles isOpen from true to false", () => {
      useSidebarStore.setState({ isOpen: true });

      const store = useSidebarStore.getState();
      store.toggle();

      const state = useSidebarStore.getState();
      expect(state.isOpen).toBe(false);
    });
  });

  describe("close", () => {
    it("sets isOpen to false", () => {
      useSidebarStore.setState({ isOpen: true });

      const store = useSidebarStore.getState();
      store.close();

      const state = useSidebarStore.getState();
      expect(state.isOpen).toBe(false);
    });

    it("is idempotent when already closed", () => {
      const store = useSidebarStore.getState();
      store.close();

      const state = useSidebarStore.getState();
      expect(state.isOpen).toBe(false);
    });
  });
});
