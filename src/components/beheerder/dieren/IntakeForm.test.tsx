// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import IntakeForm from "./IntakeForm";

vi.mock("@/lib/actions/animals", () => ({
  createAnimalIntake: vi.fn(),
}));

function getReasonSelect(): HTMLSelectElement {
  return screen.getByLabelText("Reden binnenkomst") as HTMLSelectElement;
}

describe("IntakeForm — intake reason dropdown (Story 10.21)", () => {
  it("toont exact 3 opties (+ placeholder) met de juiste labels", () => {
    render(<IntakeForm />);
    const select = getReasonSelect();
    const optionValues = Array.from(select.options).map((o) => o.value);
    const optionLabels = Array.from(select.options).map((o) => o.text);

    expect(optionValues).toEqual(["", "afstand", "ibn", "zwerfhond"]);
    expect(optionLabels).toEqual([
      "Selecteer reden...",
      "Afstand door eigenaar",
      "Inbeslagname (IBN)",
      "Vondeling",
    ]);
  });

  it("bevat geen legacy waarden 'vondeling' of 'overig' meer", () => {
    render(<IntakeForm />);
    const select = getReasonSelect();
    const values = Array.from(select.options).map((o) => o.value);

    expect(values).not.toContain("vondeling");
    expect(values).not.toContain("overig");
  });

  it("toont de IBN-conditional sectie (dossierNr + pvNr) wanneer 'ibn' geselecteerd is", () => {
    render(<IntakeForm />);
    const select = getReasonSelect();

    // Standaard: IBN-sectie niet zichtbaar
    expect(screen.queryByLabelText(/Dossiernummer/i)).toBeNull();

    fireEvent.change(select, { target: { value: "ibn" } });

    // Na keuze: dossierNr + pvNr verschijnen
    expect(screen.getByLabelText(/Dossiernummer/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/PV-nummer/i)).toBeInTheDocument();
  });

  it("toont GEEN IBN-conditional sectie wanneer 'afstand' geselecteerd is", () => {
    render(<IntakeForm />);
    const select = getReasonSelect();
    fireEvent.change(select, { target: { value: "afstand" } });

    expect(screen.queryByLabelText(/Dossiernummer/i)).toBeNull();
    expect(screen.queryByLabelText(/PV-nummer/i)).toBeNull();
  });
});
