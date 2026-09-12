import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

import "@/lib/pdf/setup";
import { CONTACT, HK_NUMBER, PDF_LETTERHEAD } from "@/lib/constants";
import type { OwnerReturnPdfData } from "@/lib/animals/owner-return";

/**
 * Story 10.64 — het formulier "Terug naar eigenaar", naar het model dat Sven
 * aanleverde (5 mei 2026): briefhoofd, volgnr/opgemaakt op/te, drie secties
 * (Eigenaar · Gegevens van het dier · Bijdrage in de kosten) en twee
 * handtekenvakken. Wat niet ingevuld is, blijft een schrijflijn: het papier
 * wordt aan de balie soms nog met de pen aangevuld.
 */

const GROEN = "#1b4332";

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9, fontFamily: "Helvetica", color: "#222" },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  orgName: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  orgLine: { fontSize: 7.5, color: "#444", marginTop: 1, textAlign: "right" },
  rule: { borderBottom: "0.8 solid #333", marginBottom: 8 },
  title: { fontSize: 15, fontFamily: "Helvetica-Bold", textAlign: "center", marginVertical: 8 },
  metaRow: { flexDirection: "row", gap: 16, marginBottom: 18 },
  metaItem: { flex: 1 },
  metaLabel: { fontSize: 7.5, color: "#555", marginBottom: 2 },
  metaValue: { fontSize: 9.5, border: "0.5 solid #888", paddingVertical: 3, paddingHorizontal: 4, minHeight: 16 },
  section: { marginTop: 10, marginBottom: 6 },
  sectionTitle: { fontSize: 10, fontFamily: "Helvetica-Bold", color: GROEN, paddingBottom: 3, borderBottom: "0.8 solid #333", marginBottom: 6 },
  box: { border: "0.5 solid #888", padding: 8 },
  fieldRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 5 },
  fieldLabel: { fontSize: 8.5, width: 150, color: "#333" },
  fieldValue: { flex: 1, fontSize: 9.5, borderBottom: "0.5 solid #888", paddingBottom: 2, minHeight: 13 },
  fieldValueSmall: { fontSize: 9.5, borderBottom: "0.5 solid #888", paddingBottom: 2, minHeight: 13 },
  addressRow: { flexDirection: "row", gap: 8, flex: 1 },
  multilineLabel: { fontSize: 8.5, color: "#333", marginBottom: 3 },
  multiline: { fontSize: 9.5, border: "0.5 solid #888", padding: 4, minHeight: 44 },
  checkRow: { flexDirection: "row", gap: 18, flex: 1 },
  checkItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  checkbox: { width: 9, height: 9, border: "0.6 solid #333", borderRadius: 5 },
  checkboxChecked: { width: 9, height: 9, border: "0.6 solid #333", borderRadius: 5, backgroundColor: GROEN },
  checkLabel: { fontSize: 8.5 },
  amountRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 6 },
  amountLabel: { fontSize: 8.5, width: 150 },
  amountLabelBold: { fontSize: 8.5, width: 150, fontFamily: "Helvetica-Bold" },
  amountValue: { width: 150, fontSize: 9.5, border: "0.5 solid #888", paddingVertical: 3, paddingHorizontal: 4, minHeight: 16, textAlign: "right" },
  euro: { fontSize: 9, marginLeft: 4 },
  sigRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 22 },
  sigBox: { width: "42%", height: 72, border: "0.6 solid #333", padding: 5 },
  sigLabel: { fontSize: 7.5, fontFamily: "Helvetica-Oblique", color: "#444" },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, textAlign: "center", fontSize: 7, color: "#999" },
});

function Veld({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.fieldRow}>
      <Text style={s.fieldLabel}>{label}</Text>
      <Text style={s.fieldValue}>{value}</Text>
    </View>
  );
}

/** Eén rond vakje zoals op Sven's formulier; gevuld = aangekruist. */
export function Vakje({ label, checked }: { label: string; checked: boolean }) {
  return (
    <View style={s.checkItem}>
      <View style={checked ? s.checkboxChecked : s.checkbox} />
      <Text style={s.checkLabel}>{label}</Text>
    </View>
  );
}

function Keuze({ label, opties }: { label: string; opties: { label: string; checked: boolean }[] }) {
  return (
    <View style={s.fieldRow}>
      <Text style={s.fieldLabel}>{label}</Text>
      <View style={s.checkRow}>
        {opties.map((o) => (
          <Vakje key={o.label} label={o.label} checked={o.checked} />
        ))}
      </View>
    </View>
  );
}

interface Props {
  data: OwnerReturnPdfData;
}

export default function OwnerReturnPdf({ data }: Props) {
  const d = data;
  return (
    <Document title={`Terug naar eigenaar ${d.formNr}`} author={PDF_LETTERHEAD.name}>
      <Page size="A4" style={s.page}>
        <View style={s.headerRow}>
          <Text style={s.orgName}>{PDF_LETTERHEAD.name}</Text>
          <View>
            <Text style={s.orgLine}>{PDF_LETTERHEAD.address}</Text>
            <Text style={s.orgLine}>{CONTACT.phone}</Text>
            <Text style={s.orgLine}>{CONTACT.emailDogs} - {CONTACT.website}</Text>
            <Text style={s.orgLine}>{HK_NUMBER}</Text>
          </View>
        </View>
        <View style={s.rule} />

        <Text style={s.title}>Terug naar eigenaar</Text>

        <View style={s.metaRow}>
          <View style={s.metaItem}>
            <Text style={s.metaLabel}>Volgnr</Text>
            <Text style={s.metaValue}>{d.formNr}</Text>
          </View>
          <View style={s.metaItem}>
            <Text style={s.metaLabel}>Opgemaakt op</Text>
            <Text style={s.metaValue}>{d.drawnUpOn}</Text>
          </View>
          <View style={s.metaItem}>
            <Text style={s.metaLabel}>Opgemaakt te</Text>
            <Text style={s.metaValue}>{d.drawnUpAt}</Text>
          </View>
        </View>

        {/* Eigenaar */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Eigenaar</Text>
          <View style={s.box}>
            <Veld label="Familienaam:" value={d.ownerLastName} />
            <Veld label="Voornaam:" value={d.ownerFirstName} />
            <View style={s.fieldRow}>
              <Text style={s.fieldLabel}>Adres:</Text>
              <View style={s.addressRow}>
                <Text style={[s.fieldValueSmall, { flex: 3 }]}>{d.ownerStreet}</Text>
                <Text style={[s.fieldValueSmall, { flex: 1 }]}>{d.ownerPostalCode}</Text>
                <Text style={[s.fieldValueSmall, { flex: 2 }]}>{d.ownerCity}</Text>
                <Text style={[s.fieldValueSmall, { flex: 1 }]}>{d.ownerCountry}</Text>
              </View>
            </View>
            <Veld label="Geboortedatum:" value={d.ownerBirthDate} />
            <Veld label="Geboorteplaats:" value={d.ownerBirthPlace} />
            <Veld label="Telefoon:" value={d.ownerPhone} />
            <Veld label="Gsm:" value={d.ownerMobile} />
            <Veld label="Email:" value={d.ownerEmail} />
          </View>
        </View>

        {/* Gegevens van het dier */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Gegevens van het dier</Text>
          <Veld label="Naam:" value={d.animalName} />
          <Veld label="Diersoort:" value={d.speciesLabel} />
          <Veld label="Ras:" value={d.animalBreed} />
          <Veld label="Geboortedatum:" value={d.animalBirthDate} />
          <Veld label="Identificatienr:" value={d.animalIdentificationNr} />
          <Keuze
            label="Geslacht:"
            opties={[
              { label: "M", checked: d.genderM },
              { label: "V", checked: d.genderV },
            ]}
          />
          <Keuze
            label="Gesteriliseerd:"
            opties={[
              { label: "Ja", checked: d.neuteredYes },
              { label: "Nee", checked: d.neuteredNo },
            ]}
          />
          <Keuze
            label="Stamboom:"
            opties={[
              { label: "Ja", checked: d.pedigreeYes },
              { label: "Nee", checked: d.pedigreeNo },
            ]}
          />
          <Veld label="Nr paspoort en/of vaccinatieboekje:" value={d.animalPassportNr} />
          {/* Eigen blok (geen rij): een lange beschrijving loopt dan gewoon door naar
              een volgende pagina in plaats van afgeknipt te worden (review 10.64). */}
          <View style={{ marginTop: 2 }}>
            <Text style={s.multilineLabel}>Beschrijving v/d vacht en eventuele bijzondere kenmerken:</Text>
            <Text style={s.multiline}>{d.animalCoatDescription}</Text>
          </View>
        </View>

        {/* Bijdrage in de kosten — als één geheel naar de volgende pagina als het niet meer past,
            samen met de handtekenvakken: die horen onder de bedragen te staan. */}
        <View style={s.section} wrap={false}>
          <Text style={s.sectionTitle}>Bijdrage in de kosten</Text>
          <View style={s.amountRow}>
            <Text style={s.amountLabel}>Verblijfskosten:</Text>
            <Text style={s.amountValue}>{d.stayCosts}</Text>
          </View>
          <View style={s.amountRow}>
            <Text style={s.amountLabelBold}>Totaal betaald bedrag:</Text>
            <Text style={s.amountValue}>{d.totalPaid}</Text>
            <Text style={s.euro}>€</Text>
          </View>

          <View style={s.sigRow}>
            <View style={s.sigBox}>
              <Text style={s.sigLabel}>Eigenaar</Text>
            </View>
            <View style={s.sigBox}>
              <Text style={s.sigLabel}>De afgevaardigde dierenasiel</Text>
            </View>
          </View>
        </View>

        {/* `fixed`: anders schuift de voettekst als laatste element naar een lege tweede pagina. */}
        <Text style={s.footer} fixed>{PDF_LETTERHEAD.name} — Terug naar eigenaar — {d.formNr}</Text>
      </Page>
    </Document>
  );
}
