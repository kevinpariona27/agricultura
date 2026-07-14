import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Sidebar } from "../Sidebar.js";

// We need the store to control isOpen state
import { useSidebarStore } from "../../../stores/sidebar.js";

beforeEach(() => {
  useSidebarStore.setState({ isOpen: false });
});

/**
 * Renders the Sidebar inside a MemoryRouter for NavLink context.
 */
function renderSidebar() {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Sidebar />
    </MemoryRouter>
  );
}

describe("Sidebar integration", () => {
  describe("renders correctly", () => {
    it("renders the sidebar brand text", () => {
      renderSidebar();
      expect(screen.getByText("Gestión Agrícola")).toBeInTheDocument();
    });

    it("renders all navigation links", () => {
      renderSidebar();
      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Parcelas")).toBeInTheDocument();
      expect(screen.getByText("Cultivos")).toBeInTheDocument();
      expect(screen.getByText("Riegos")).toBeInTheDocument();
    });

    it("renders logout button", () => {
      renderSidebar();
      expect(screen.getByText("Cerrar sesión")).toBeInTheDocument();
    });
  });

  describe("mobile overlay behavior", () => {
    it("shows backdrop when sidebar isOpen is true", () => {
      useSidebarStore.setState({ isOpen: true });
      renderSidebar();

      const backdrop = screen.getByTestId("sidebar-backdrop");
      expect(backdrop).toBeInTheDocument();
    });

    it("closes sidebar when backdrop is clicked", () => {
      useSidebarStore.setState({ isOpen: true });
      renderSidebar();

      const backdrop = screen.getByTestId("sidebar-backdrop");
      fireEvent.click(backdrop);
      expect(useSidebarStore.getState().isOpen).toBe(false);
    });

    it("closes sidebar when ESC key is pressed", () => {
      useSidebarStore.setState({ isOpen: true });
      renderSidebar();

      fireEvent.keyDown(document, { key: "Escape" });
      expect(useSidebarStore.getState().isOpen).toBe(false);
    });

    it("does not react to non-Escape key presses", () => {
      useSidebarStore.setState({ isOpen: true });
      renderSidebar();

      fireEvent.keyDown(document, { key: "Enter" });
      expect(useSidebarStore.getState().isOpen).toBe(true);
    });

    it("does not trigger ESC close when sidebar is already closed", () => {
      renderSidebar();

      fireEvent.keyDown(document, { key: "Escape" });
      // Should not throw; isOpen stays false
      expect(useSidebarStore.getState().isOpen).toBe(false);
    });
  });

  describe("ARIA accessibility", () => {
    it("sidebar has role complementary and aria-label", () => {
      renderSidebar();

      const aside = screen.getByRole("complementary");
      expect(aside).toBeInTheDocument();
      expect(aside).toHaveAttribute("aria-label", "Sidebar navigation");
    });
  });
});
