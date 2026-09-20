import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Sidebar } from "@/components/Sidebar";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

describe("Sidebar", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ authRequired: false, username: null }) }),
    );
  });


  it("renders the primary nav links and children", () => {
    render(
      <Sidebar>
        <p>Page content</p>
      </Sidebar>,
    );
    const nav = screen.getByRole("navigation", { name: "Primary" });
    expect(nav.querySelector('a[href="/chat"]')).not.toBeNull();
    expect(nav.querySelector('a[href="/analyze"]')).not.toBeNull();
    expect(screen.getByText("Page content")).toBeInTheDocument();
  });

  it("toggles the mobile drawer open and closed", () => {
    render(
      <Sidebar>
        <p>Page content</p>
      </Sidebar>,
    );
    const toggle = screen.getByRole("button", { name: /toggle navigation/i });
    expect(screen.queryByRole("navigation", { name: "Primary mobile" })).toBeNull();

    fireEvent.click(toggle);
    expect(screen.getByRole("navigation", { name: "Primary mobile" })).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/close navigation/i));
    expect(screen.queryByRole("navigation", { name: "Primary mobile" })).toBeNull();
  });

  it("collapses the desktop sidebar, hiding link labels", () => {
    render(
      <Sidebar>
        <p>Page content</p>
      </Sidebar>,
    );
    expect(screen.getByText("Legal Q&A")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /collapse/i }));
    expect(screen.queryByText("Legal Q&A")).toBeNull();
  });
});

describe("Sidebar on /login", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => ({ authRequired: false, username: null }) }),
    );
  });

  it("renders only the children, with no nav chrome", async () => {
    vi.resetModules();
    vi.doMock("next/navigation", () => ({
      usePathname: () => "/login",
      useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
    }));
    const { Sidebar: SidebarOnLogin } = await import("@/components/Sidebar");
    render(
      <SidebarOnLogin>
        <p>Login form</p>
      </SidebarOnLogin>,
    );
    expect(screen.getByText("Login form")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Primary" })).toBeNull();
  });
});
