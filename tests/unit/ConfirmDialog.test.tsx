import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ConfirmDialog } from "@/components/ConfirmDialog";

describe("ConfirmDialog", () => {
  it("renders nothing when closed", () => {
    render(
      <ConfirmDialog
        open={false}
        title="Log out?"
        message="Are you sure?"
        confirmLabel="Log out"
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("renders the title/message and calls onConfirm/onCancel", () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Log out?"
        message="You'll be signed out."
        confirmLabel="Log out"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    expect(screen.getByRole("alertdialog", { name: "Log out?" })).toBeInTheDocument();
    expect(screen.getByText("You'll be signed out.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Log out" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("cancels on Escape and on backdrop click", () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Log out?"
        message="You'll be signed out."
        confirmLabel="Log out"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    fireEvent.keyDown(document, { key: "Escape" });
    expect(onCancel).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /dismiss dialog/i }));
    expect(onCancel).toHaveBeenCalledTimes(2);
  });

  it("disables both buttons while isConfirming is true", () => {
    render(
      <ConfirmDialog
        open
        title="Log out?"
        message="You'll be signed out."
        confirmLabel="Log out"
        isConfirming
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
    expect(screen.getByRole("button", { name: /please wait/i })).toBeDisabled();
  });
});
