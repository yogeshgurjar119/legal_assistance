import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act, within } from "@testing-library/react";
import { Sidebar } from "@/components/Sidebar";

const pushMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
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

describe("Sidebar logout confirmation (authRequired: true)", () => {
  beforeEach(() => {
    pushMock.mockClear();
    refreshMock.mockClear();
    vi.stubGlobal(
      "fetch",
      vi.fn((url: string, init?: RequestInit) => {
        if (typeof url === "string" && url.includes("/api/auth/logout")) {
          return Promise.resolve({ ok: true, json: async () => ({ ok: true }) });
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({ authRequired: true, username: "admin@legal.com" }),
        });
      }),
    );
  });

  it("clicking Log out opens a confirmation dialog instead of logging out immediately", async () => {
    render(
      <Sidebar>
        <p>Page content</p>
      </Sidebar>,
    );

    const logoutButton = await screen.findByRole("button", { name: "Log out" });
    fireEvent.click(logoutButton);

    expect(await screen.findByRole("alertdialog", { name: /log out\?/i })).toBeInTheDocument();
    // No navigation should have happened yet — logout requires explicit confirmation.
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("Cancel dismisses the dialog without logging out", async () => {
    render(
      <Sidebar>
        <p>Page content</p>
      </Sidebar>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Log out" }));
    await screen.findByRole("alertdialog");

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.queryByRole("alertdialog")).toBeNull();
    });
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("confirming logs out and redirects to /login", async () => {
    render(
      <Sidebar>
        <p>Page content</p>
      </Sidebar>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Log out" }));
    await screen.findByRole("alertdialog");

    // Two "Log out" buttons now exist: the sidebar trigger and the dialog's
    // confirm button — target the one inside the dialog.
    const dialog = screen.getByRole("alertdialog");
    await act(async () => {
      fireEvent.click(within(dialog).getByRole("button", { name: "Log out" }));
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/login");
    });
    expect(refreshMock).toHaveBeenCalled();
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
