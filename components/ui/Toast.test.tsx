import { describe, it, expect } from "vitest";
import { useState } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ToastProvider, useToast } from "./Toast";

function ConfirmHarness() {
  const { confirm } = useToast();
  const [result, setResult] = useState("idle");
  return (
    <>
      <button onClick={async () => setResult(String(await confirm("Delete this?")))}>
        ask
      </button>
      <div data-testid="result">{result}</div>
    </>
  );
}

function renderConfirm() {
  return render(
    <ToastProvider>
      <ConfirmHarness />
    </ToastProvider>,
  );
}

describe("confirm dialog", () => {
  it("opens an alertdialog with the message and focuses Cancel", async () => {
    const user = userEvent.setup();
    renderConfirm();
    await user.click(screen.getByText("ask"));

    const dialog = await screen.findByRole("alertdialog");
    expect(dialog).toHaveTextContent("Delete this?");
    // Focus moves to the safe default (Cancel) on open.
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus(),
    );
  });

  it("resolves true when Confirm is clicked", async () => {
    const user = userEvent.setup();
    renderConfirm();
    await user.click(screen.getByText("ask"));
    await user.click(await screen.findByRole("button", { name: "Confirm" }));

    expect(screen.getByTestId("result")).toHaveTextContent("true");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("resolves false when Cancel is clicked", async () => {
    const user = userEvent.setup();
    renderConfirm();
    await user.click(screen.getByText("ask"));
    await user.click(await screen.findByRole("button", { name: "Cancel" }));

    expect(screen.getByTestId("result")).toHaveTextContent("false");
  });

  it("resolves false when Escape is pressed", async () => {
    const user = userEvent.setup();
    renderConfirm();
    await user.click(screen.getByText("ask"));
    await screen.findByRole("alertdialog");
    await user.keyboard("{Escape}");

    await waitFor(() =>
      expect(screen.getByTestId("result")).toHaveTextContent("false"),
    );
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });

  it("makes the page behind the dialog inert, then restores it", async () => {
    const user = userEvent.setup();
    const { container } = renderConfirm();
    expect(container.querySelector("[inert]")).toBeNull();

    await user.click(screen.getByText("ask"));
    await screen.findByRole("alertdialog");
    expect(container.querySelector("[inert]")).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Confirm" }));
    await waitFor(() =>
      expect(container.querySelector("[inert]")).toBeNull(),
    );
  });
});

function NotifyHarness() {
  const { toast } = useToast();
  return <button onClick={() => toast("Saved", "success")}>notify</button>;
}

describe("notification toast", () => {
  it("shows a status message and dismisses on click", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <NotifyHarness />
      </ToastProvider>,
    );

    await user.click(screen.getByText("notify"));
    expect(await screen.findByText("Saved")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    await waitFor(() =>
      expect(screen.queryByText("Saved")).not.toBeInTheDocument(),
    );
  });
});
