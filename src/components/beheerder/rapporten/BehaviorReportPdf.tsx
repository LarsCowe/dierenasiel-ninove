import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { BEHAVIOR_VERZORGERS_ITEMS, BEHAVIOR_HONDEN_ITEMS } from "@/lib/constants";
import type { BehaviorRecord, BehaviorChecklist, Animal } from "@/types";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { marginBottom: 20, textAlign: "center" },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 10, fontStyle: "italic", color: "#666", marginBottom: 2 },
  org: { fontSize: 9, color: "#666", marginBottom: 2 },
  meta: { marginBottom: 12, paddingBottom: 8, borderBottom: "1 solid #ccc" },
  metaText: { fontSize: 10 },
  metaLabel: { fontFamily: "Helvetica-Bold", color: "#555" },
  recordSection: { marginBottom: 14 },
  recordTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 6, color: "#1b4332", borderBottom: "0.5 solid #1b4332", paddingBottom: 3 },
  sectionLabel: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#1b4332", marginBottom: 3, marginTop: 6 },
  table: { marginBottom: 4 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f3f4f6", borderBottom: "0.5 solid #ccc", paddingVertical: 4, paddingHorizontal: 6 },
  tableRow: { flexDirection: "row", borderBottom: "0.5 solid #eee", paddingVertical: 3, paddingHorizontal: 6 },
  headerText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#374151" },
  cellText: { fontSize: 8 },
  colItem: { width: "60%" },
  colValue: { width: "40%" },
  notesBlock: { marginTop: 6, padding: 6, backgroundColor: "#f9fafb", borderRadius: 2 },
  notesText: { fontSize: 9, lineHeight: 1.4 },
  empty: { fontSize: 9, color: "#999", fontStyle: "italic", paddingVertical: 8, textAlign: "center" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", fontSize: 8, color: "#999" },
});

function formatBool(val: unknown): string {
  if (val === true) return "Ja";
  if (val === false) return "Nee";
  return "—";
}

interface Props {
  animal: Pick<Animal, "id" | "name" | "species" | "breed">;
  records: BehaviorRecord[];
  generatedAt: string;
}

export default function BehaviorReportPdf({ animal, records, generatedAt }: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.org}>Dierenasiel Ninove VZW</Text>
          <Text style={styles.org}>Minnenhofstraat 24, 9400 Denderwindeke</Text>
          <Text style={styles.title}>Evaluatiefiche van het gedrag in het asiel</Text>
          <Text style={styles.subtitle}>Bijlage VIII B bij het koninklijk besluit van 27 april 2007</Text>
        </View>

        <View style={styles.meta}>
          <Text style={styles.metaText}>
            <Text style={styles.metaLabel}>Dier: </Text>
            {animal.name} ({animal.species}{animal.breed ? ` — ${animal.breed}` : ""})
          </Text>
          <Text style={styles.metaText}>
            <Text style={styles.metaLabel}>Gegenereerd op: </Text>
            {generatedAt}
          </Text>
          <Text style={styles.metaText}>
            <Text style={styles.metaLabel}>Aantal fiches: </Text>
            {records.length}
          </Text>
        </View>

        {records.length === 0 ? (
          <Text style={styles.empty}>Geen gedragsfiches gevonden voor dit dier.</Text>
        ) : (
          records.map((record, idx) => {
            const checklist = record.checklist as Record<string, unknown>;
            return (
              <View key={record.id} style={styles.recordSection}>
                <Text style={styles.recordTitle}>
                  Gedragsfiche {idx + 1} — {record.date}
                </Text>

                {/* Sectie 1: Verzorgers */}
                <Text style={styles.sectionLabel}>1. Gedrag tegenover de verzorgers</Text>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.colItem, styles.headerText]}>Criterium</Text>
                    <Text style={[styles.colValue, styles.headerText]}>Ja / Nee</Text>
                  </View>
                  {BEHAVIOR_VERZORGERS_ITEMS.map((item) => (
                    <View key={item.key} style={styles.tableRow}>
                      <Text style={[styles.colItem, styles.cellText]}>{item.label}</Text>
                      <Text style={[styles.colValue, styles.cellText]}>
                        {formatBool(checklist[item.key])}
                      </Text>
                    </View>
                  ))}
                  {typeof checklist.verzorgers_andere === "string" && checklist.verzorgers_andere && (
                    <View style={styles.tableRow}>
                      <Text style={[styles.colItem, styles.cellText]}>Andere</Text>
                      <Text style={[styles.colValue, styles.cellText]}>
                        {checklist.verzorgers_andere}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Sectie 2: Andere honden */}
                <Text style={styles.sectionLabel}>2. Gedrag tegenover andere honden</Text>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.colItem, styles.headerText]}>Criterium</Text>
                    <Text style={[styles.colValue, styles.headerText]}>Ja / Nee</Text>
                  </View>
                  {BEHAVIOR_HONDEN_ITEMS.map((item) => (
                    <View key={item.key} style={styles.tableRow}>
                      <Text style={[styles.colItem, styles.cellText]}>{item.label}</Text>
                      <Text style={[styles.colValue, styles.cellText]}>
                        {formatBool(checklist[item.key])}
                      </Text>
                    </View>
                  ))}
                  {typeof checklist.honden_andere === "string" && checklist.honden_andere && (
                    <View style={styles.tableRow}>
                      <Text style={[styles.colItem, styles.cellText]}>Andere</Text>
                      <Text style={[styles.colValue, styles.cellText]}>
                        {checklist.honden_andere}
                      </Text>
                    </View>
                  )}
                </View>

                {record.notes && (
                  <View style={styles.notesBlock}>
                    <Text style={[styles.notesText, { fontFamily: "Helvetica-Bold" }]}>Opmerkingen:</Text>
                    <Text style={styles.notesText}>{record.notes}</Text>
                  </View>
                )}
              </View>
            );
          })
        )}

        <Text style={styles.footer}>
          Dierenasiel Ninove VZW — Evaluatiefiche gedrag (Bijlage VIII B)
        </Text>
      </Page>
    </Document>
  );
}
