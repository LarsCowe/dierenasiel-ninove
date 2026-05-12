"use client";

import { useRouter } from "next/navigation";
import type React from "react";

// Selector voor elementen die hun eigen click-actie hebben en niet door de
// rij-navigatie gekaapt mogen worden. Voeg `data-stop-row-click` toe op een
// custom container om hetzelfde effect te krijgen voor non-standaard widgets.
const INTERACTIVE_SELECTOR =
  "button, a, input, select, textarea, [contenteditable='true'], [data-stop-row-click]";

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.closest(INTERACTIVE_SELECTOR) !== null;
}

export interface UseClickableRowOptions {
  ariaLabel?: string;
}

export interface ClickableRowProps {
  role: "link";
  tabIndex: 0;
  onClick: (e: React.MouseEvent) => void;
  onAuxClick: (e: React.MouseEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  "aria-label"?: string;
}

export function useClickableRow(
  href: string,
  options?: UseClickableRowOptions,
): ClickableRowProps {
  const router = useRouter();

  const onClick = (e: React.MouseEvent) => {
    if (e.defaultPrevented) return;
    if (isInteractiveTarget(e.target)) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    router.push(href);
  };

  const onAuxClick = (e: React.MouseEvent) => {
    if (e.defaultPrevented) return;
    if (isInteractiveTarget(e.target)) return;
    if (e.button === 1) {
      window.open(href, "_blank", "noopener,noreferrer");
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.defaultPrevented) return;
    if (isInteractiveTarget(e.target)) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      router.push(href);
    }
  };

  const props: ClickableRowProps = {
    role: "link",
    tabIndex: 0,
    onClick,
    onAuxClick,
    onKeyDown,
  };
  if (options?.ariaLabel) {
    props["aria-label"] = options.ariaLabel;
  }
  return props;
}
