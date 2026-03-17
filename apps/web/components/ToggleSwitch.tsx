"use client";

import type { ReactNode } from "react";

export function ToggleSwitch({
  checked,
  onChange,
  iconLeft,
  iconRight,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  iconLeft: ReactNode;
  iconRight: ReactNode;
  ariaLabel: string;
}) {
  return (
    <label className="toggle-switch" aria-label={ariaLabel}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="toggle-switch__input"
      />
      <span className="toggle-switch__track" aria-hidden="true">
        {/* Active icon appears in the empty space opposite the knob */}
        <span className={`toggle-switch__reveal toggle-switch__reveal--left ${checked ? "toggle-switch__reveal--visible" : ""}`}>
          {iconRight}
        </span>
        <span className={`toggle-switch__reveal toggle-switch__reveal--right ${!checked ? "toggle-switch__reveal--visible" : ""}`}>
          {iconLeft}
        </span>
        {/* Knob with grip lines */}
        <span className="toggle-switch__knob">
          <span className="toggle-switch__grip" />
          <span className="toggle-switch__grip" />
          <span className="toggle-switch__grip" />
        </span>
      </span>
    </label>
  );
}
