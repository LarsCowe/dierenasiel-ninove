// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent } from "@testing-library/react";
import { useClickableRow } from "./useClickableRow";

const { mockPush } = vi.hoisted(() => ({ mockPush: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockWindowOpen = vi.fn();

function TestRow({
  href,
  ariaLabel,
  children,
}: {
  href: string;
  ariaLabel?: string;
  children?: React.ReactNode;
}) {
  const props = useClickableRow(href, { ariaLabel });
  return (
    <table>
      <tbody>
        <tr data-testid="row" {...props}>
          <td>{children ?? "cell"}</td>
        </tr>
      </tbody>
    </table>
  );
}

describe("useClickableRow", () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockWindowOpen.mockClear();
    vi.stubGlobal("open", mockWindowOpen);
  });

  it("returns role='link' and tabIndex=0 props", () => {
    const { getByTestId } = render(<TestRow href="/foo" />);
    const row = getByTestId("row");
    expect(row.getAttribute("role")).toBe("link");
    expect(row.getAttribute("tabindex")).toBe("0");
  });

  it("applies aria-label when provided", () => {
    const { getByTestId } = render(<TestRow href="/foo" ariaLabel="Bekijk Rex" />);
    expect(getByTestId("row").getAttribute("aria-label")).toBe("Bekijk Rex");
  });

  it("omits aria-label when not provided", () => {
    const { getByTestId } = render(<TestRow href="/foo" />);
    expect(getByTestId("row").getAttribute("aria-label")).toBeNull();
  });

  it("navigates via router.push on plain left click", () => {
    const { getByTestId } = render(<TestRow href="/beheerder/dieren/1" />);
    fireEvent.click(getByTestId("row"));
    expect(mockPush).toHaveBeenCalledWith("/beheerder/dieren/1");
    expect(mockWindowOpen).not.toHaveBeenCalled();
  });

  it("opens new tab on ctrl-click", () => {
    const { getByTestId } = render(<TestRow href="/beheerder/dieren/1" />);
    fireEvent.click(getByTestId("row"), { ctrlKey: true });
    expect(mockWindowOpen).toHaveBeenCalledWith(
      "/beheerder/dieren/1",
      "_blank",
      "noopener,noreferrer",
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("opens new tab on cmd-click (metaKey)", () => {
    const { getByTestId } = render(<TestRow href="/foo" />);
    fireEvent.click(getByTestId("row"), { metaKey: true });
    expect(mockWindowOpen).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("opens new tab on shift-click", () => {
    const { getByTestId } = render(<TestRow href="/foo" />);
    fireEvent.click(getByTestId("row"), { shiftKey: true });
    expect(mockWindowOpen).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("opens new tab on middle-click via auxClick (button=1)", () => {
    const { getByTestId } = render(<TestRow href="/foo" />);
    const event = new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 1 });
    getByTestId("row").dispatchEvent(event);
    expect(mockWindowOpen).toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does NOT navigate on auxClick with right-button (button=2)", () => {
    const { getByTestId } = render(<TestRow href="/foo" />);
    const event = new MouseEvent("auxclick", { bubbles: true, cancelable: true, button: 2 });
    getByTestId("row").dispatchEvent(event);
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockWindowOpen).not.toHaveBeenCalled();
  });

  it("navigates on Enter key", () => {
    const { getByTestId } = render(<TestRow href="/foo" />);
    fireEvent.keyDown(getByTestId("row"), { key: "Enter" });
    expect(mockPush).toHaveBeenCalledWith("/foo");
  });

  it("navigates on Space key and prevents page scroll", () => {
    const { getByTestId } = render(<TestRow href="/foo" />);
    const event = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
    getByTestId("row").dispatchEvent(event);
    expect(mockPush).toHaveBeenCalledWith("/foo");
    expect(event.defaultPrevented).toBe(true);
  });

  it("does NOT navigate on other keys (e.g. 'a')", () => {
    const { getByTestId } = render(<TestRow href="/foo" />);
    fireEvent.keyDown(getByTestId("row"), { key: "a" });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does NOT navigate when click target is a <button>", () => {
    const { container } = render(
      <TestRow href="/foo">
        <button type="button">Delete</button>
      </TestRow>,
    );
    const button = container.querySelector("button")!;
    fireEvent.click(button);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does NOT navigate when click target is an <a>", () => {
    const { container } = render(
      <TestRow href="/foo">
        <a href="/elsewhere">link</a>
      </TestRow>,
    );
    const link = container.querySelector("a")!;
    fireEvent.click(link);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does NOT navigate when click target is <input>, <select> or <textarea>", () => {
    for (const tag of ["input", "select", "textarea"] as const) {
      const { container } = render(
        <TestRow href="/foo">
          {tag === "input" && <input type="text" />}
          {tag === "select" && (
            <select>
              <option>x</option>
            </select>
          )}
          {tag === "textarea" && <textarea />}
        </TestRow>,
      );
      const el = container.querySelector(tag)!;
      fireEvent.click(el);
      expect(mockPush).not.toHaveBeenCalled();
    }
  });

  it("does NOT navigate when click target has [data-stop-row-click] ancestor", () => {
    const { container } = render(
      <TestRow href="/foo">
        <div data-stop-row-click>
          <span>inner</span>
        </div>
      </TestRow>,
    );
    const span = container.querySelector("span")!;
    fireEvent.click(span);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("does NOT navigate when event.defaultPrevented is true", () => {
    const { getByTestId } = render(<TestRow href="/foo" />);
    const event = new MouseEvent("click", { bubbles: true, cancelable: true });
    event.preventDefault();
    getByTestId("row").dispatchEvent(event);
    expect(mockPush).not.toHaveBeenCalled();
  });
});
