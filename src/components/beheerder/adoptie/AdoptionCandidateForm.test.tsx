// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AdoptionCandidateForm from "./AdoptionCandidateForm";

const { mockRouterPush, mockCreateCandidate } = vi.hoisted(() => ({
  mockRouterPush: vi.fn(),
  mockCreateCandidate: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockRouterPush }),
}));

vi.mock("@/lib/actions/adoption-candidates", () => ({
  createAdoptionCandidate: mockCreateCandidate,
}));

const availableAnimals = [
  { id: 1, name: "Rex", species: "hond", identificationNr: "BE123" },
  { id: 2, name: "Mimi", species: "kat", identificationNr: "BE456" },
];

// Gebruik exacte labels om ambiguïteit te vermijden (E-mailadres vs Adres).
const getFirstName = () => screen.getByLabelText("Voornaam *") as HTMLInputElement;
const getLastName = () => screen.getByLabelText("Achternaam *") as HTMLInputElement;
const getEmail = () => screen.getByLabelText("E-mailadres *") as HTMLInputElement;
const getPhone = () => screen.getByLabelText("Telefoon") as HTMLInputElement;
const getAddress = () => screen.getByLabelText("Adres") as HTMLInputElement;

function fillPersonalFields(values: Partial<Record<"firstName" | "lastName" | "email" | "phone" | "address", string>>) {
  if (values.firstName !== undefined) fireEvent.change(getFirstName(), { target: { value: values.firstName } });
  if (values.lastName !== undefined) fireEvent.change(getLastName(), { target: { value: values.lastName } });
  if (values.email !== undefined) fireEvent.change(getEmail(), { target: { value: values.email } });
  if (values.phone !== undefined) fireEvent.change(getPhone(), { target: { value: values.phone } });
  if (values.address !== undefined) fireEvent.change(getAddress(), { target: { value: values.address } });
}

// Vind de woonsituatie select via de unieke optie "appartement" (label heeft geen htmlFor).
function getWoonsituatieSelect(container: HTMLElement): HTMLSelectElement {
  const select = Array.from(container.querySelectorAll("select")).find((s) =>
    s.querySelector('option[value="appartement"]'),
  );
  if (!select) throw new Error("woonsituatie select niet gevonden");
  return select as HTMLSelectElement;
}

function lastPayloadJson(): Record<string, unknown> {
  const lastCall = mockCreateCandidate.mock.calls.at(-1);
  if (!lastCall) throw new Error("createAdoptionCandidate is niet aangeroepen");
  const fd = lastCall[1] as FormData;
  return JSON.parse(fd.get("json") as string);
}

describe("AdoptionCandidateForm — veldretentie bij validatiefout", () => {
  beforeEach(() => {
    mockRouterPush.mockReset();
    mockCreateCandidate.mockReset();
  });

  it("AC1: behoudt alle persoonlijke-gegevens-velden wanneer questionnaire een validatiefout retourneert", async () => {
    mockCreateCandidate.mockResolvedValue({
      success: false,
      error: "Niet alle verplichte velden zijn correct ingevuld.",
      fieldErrors: { questionnaireAnswers: ["Vul alle verplichte velden in"] },
    });

    render(<AdoptionCandidateForm availableAnimals={availableAnimals} />);

    fillPersonalFields({
      firstName: "Jan",
      lastName: "Janssens",
      email: "jan@example.com",
      phone: "0473123456",
      address: "Hoofdstraat 1, 9400 Ninove",
    });

    fireEvent.click(screen.getByRole("button", { name: /aanvraag registreren/i }));

    await waitFor(() => {
      expect(screen.getByText(/niet alle verplichte velden zijn correct ingevuld/i)).toBeInTheDocument();
    });

    expect(getFirstName().value).toBe("Jan");
    expect(getLastName().value).toBe("Janssens");
    expect(getEmail().value).toBe("jan@example.com");
    expect(getPhone().value).toBe("0473123456");
    expect(getAddress().value).toBe("Hoofdstraat 1, 9400 Ninove");
  });

  it("AC2: behoudt firstName wanneer email een validatiefout retourneert", async () => {
    mockCreateCandidate.mockResolvedValue({
      success: false,
      error: "Niet alle verplichte velden zijn correct ingevuld.",
      fieldErrors: { email: ["Ongeldig e-mailadres"] },
    });

    render(<AdoptionCandidateForm availableAnimals={availableAnimals} />);

    fillPersonalFields({ firstName: "Sven" });
    fireEvent.click(screen.getByRole("button", { name: /aanvraag registreren/i }));

    await waitFor(() => {
      expect(screen.getByText(/ongeldig e-mailadres/i)).toBeInTheDocument();
    });

    expect(getFirstName().value).toBe("Sven");
  });

  it("AC5: behoudt questionnaire.woonsituatie + werksituatie DOM-waarden bij validatiefout", async () => {
    mockCreateCandidate.mockResolvedValue({
      success: false,
      error: "Niet alle verplichte velden zijn correct ingevuld.",
      fieldErrors: { firstName: ["Verplicht"] },
    });

    const { container } = render(<AdoptionCandidateForm availableAnimals={availableAnimals} />);

    // Selecteer "appartement" als woonsituatie via de unieke optie.
    const woonsituatie = getWoonsituatieSelect(container);
    fireEvent.change(woonsituatie, { target: { value: "appartement" } });

    // Selecteer werksituatie via unieke optie "deeltijds".
    const werksituatie = Array.from(container.querySelectorAll("select")).find((s) =>
      s.querySelector('option[value="deeltijds"]'),
    ) as HTMLSelectElement;
    fireEvent.change(werksituatie, { target: { value: "deeltijds" } });

    fireEvent.click(screen.getByRole("button", { name: /aanvraag registreren/i }));

    await waitFor(() => {
      expect(screen.getByText(/verplicht/i)).toBeInTheDocument();
    });

    // Cruciaal: DOM-waarden van controlled <select> moeten zichtbaar blijven,
    // niet enkel in React state. Reproduceert klantfeedback 2026-04-21 van Sven.
    expect(getWoonsituatieSelect(container).value).toBe("appartement");
    expect(
      (Array.from(container.querySelectorAll("select")).find((s) =>
        s.querySelector('option[value="deeltijds"]'),
      ) as HTMLSelectElement).value,
    ).toBe("deeltijds");
  });

  it("AC5b: payload bevat ingevulde questionnaire-waarden (state-integriteit)", async () => {
    mockCreateCandidate.mockResolvedValue({ success: false, error: "fout", fieldErrors: {} });

    const { container } = render(<AdoptionCandidateForm availableAnimals={availableAnimals} />);
    fireEvent.change(getWoonsituatieSelect(container), { target: { value: "appartement" } });
    fireEvent.click(screen.getByRole("button", { name: /aanvraag registreren/i }));

    await waitFor(() => expect(mockCreateCandidate).toHaveBeenCalled());
    const payload = lastPayloadJson() as { questionnaireAnswers?: { woonsituatie?: string } };
    expect(payload.questionnaireAnswers?.woonsituatie).toBe("appartement");
  });

  it("AC4: toont rode rand ENKEL op leeg verplicht questionnaire-veld, niet op correct ingevulde", async () => {
    mockCreateCandidate.mockResolvedValue({
      success: false,
      error: "Niet alle verplichte velden zijn correct ingevuld.",
      fieldErrors: { questionnaireAnswers: ["Motivatie is verplicht"] },
    });

    const { container } = render(<AdoptionCandidateForm availableAnimals={availableAnimals} />);

    // Vul woonsituatie + werksituatie correct in. Laat motivatie leeg.
    fireEvent.change(getWoonsituatieSelect(container), { target: { value: "appartement" } });
    const werksituatie = Array.from(container.querySelectorAll("select")).find((s) =>
      s.querySelector('option[value="deeltijds"]'),
    ) as HTMLSelectElement;
    fireEvent.change(werksituatie, { target: { value: "deeltijds" } });

    fireEvent.click(screen.getByRole("button", { name: /aanvraag registreren/i }));

    await waitFor(() => {
      expect(screen.getByText(/niet alle verplichte velden zijn correct ingevuld/i)).toBeInTheDocument();
    });

    // Correct ingevulde velden mogen geen rode rand hebben.
    expect(getWoonsituatieSelect(container).className).not.toMatch(/border-red-500/);
    const werksituatiePost = Array.from(container.querySelectorAll("select")).find((s) =>
      s.querySelector('option[value="deeltijds"]'),
    ) as HTMLSelectElement;
    expect(werksituatiePost.className).not.toMatch(/border-red-500/);

    // Motivatie (leeg) moet wel rood zijn.
    const motivatie = container.querySelector('textarea[placeholder*="Waarom"]') as HTMLTextAreaElement;
    expect(motivatie.className).toMatch(/border-red-500/);
  });

  it("AC3: navigeert naar /beheerder/adoptie/[id] na succesvolle submit", async () => {
    mockCreateCandidate.mockResolvedValue({
      success: true,
      data: { id: 42 },
    });

    render(<AdoptionCandidateForm availableAnimals={availableAnimals} />);

    fillPersonalFields({
      firstName: "Jan",
      lastName: "Janssens",
      email: "jan@example.com",
    });

    fireEvent.click(screen.getByRole("button", { name: /aanvraag registreren/i }));

    await waitFor(() => {
      expect(mockRouterPush).toHaveBeenCalledWith("/beheerder/adoptie/42");
    });
  });
});
