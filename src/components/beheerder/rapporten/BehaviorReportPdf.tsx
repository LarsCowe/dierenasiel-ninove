import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { BEHAVIOR_CHECKLIST_LABELS } from "@/lib/constants";
import type { BehaviorRecord, BehaviorChecklist, Animal } from "@/types";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { marginBottom: 20, textAlign: "center" },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  org: { fontSize: 9, color: "#666", marginBottom: 2 },
  meta: { marginBottom: 12, paddingBottom: 8, borderBottom: "1 solid #ccc" },
  metaText: { fontSize: 10 },
  metaLabel: { fontFamily: "Helvetica-Bold", color: "#555" },
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 6, color: "#1b4332", borderBottom: "0.5 solid #1b4332", paddingBottom: 3 },
  table: { marginBottom: 4 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f3f4f6", borderBottom: "0.5 solid #ccc", paddingVertical: 4, paddingHorizontal: 6 },
  tableRow: { flexDirection: "row", borderBottom: "0.5 solid #eee", paddingVertical: 3, paddingHorizontal: 6 },
  headerText: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#374151" },
  cellText: { fontSize: 8 },
  colItem: { width: "40%" },
  colScore: { width: "15%" },
  colDate: { width: "20%" },
  colNotes: { width: "45%" },
  notesBlock: { marginTop: 6, padding: 6, backgroundColor: "#f9fafb", borderRadius: 2 },
  notesText: { fontSize: 9, lineHeight: 1.4 },
  empty: { fontSize: 9, color: "#999", fontStyle: "italic", paddingVertical: 8, textAlign: "center" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", fontSize: 8, color: "#999" },
});

const CHECKLIST_LABELS = BEHAVIOR_CHECKLIST_LABELS;

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
          <Text style={styles.title}>Gedragsfiches</Text>
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
            const checklist = record.checklist as BehaviorChecklist;
            return (
              <View key={record.id} style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Gedragsfiche {idx + 1} — {record.date}
                </Text>
                <View style={styles.table}>
                  <View style={styles.tableHeader}>
                    <Text style={[styles.colItem, styles.headerText]}>Criterium</Text>
                    <Text style={[styles.colScore, styles.headerText]}>Score (1-5)</Text>
                  </View>
                  {Object.entries(CHECKLIST_LABELS).map(([key, label]) => (
                    <View key={key} style={styles.tableRow}>
                      <Text style={[styles.colItem, styles.cellText]}>{label}</Text>
                      <Text style={[styles.colScore, styles.cellText]}>
                        {checklist[key as keyof typeof checklist]?.toString() ?? "-"}
                      </Text>
                    </View>
                  ))}
                  <View style={styles.tableRow}>
                    <Text style={[styles.colItem, styles.cellText]}>Zindelijk</Text>
                    <Text style={[styles.colScore, styles.cellText]}>
                      {checklist.zindelijk === true ? "Ja" : checklist.zindelijk === false ? "Nee" : "Onbekend"}
                    </Text>
                  </View>
                </View>

                {checklist.aandachtspunten && checklist.aandachtspunten.length > 0 && (
                  <View style={styles.notesBlock}>
                    <Text style={[styles.notesText, { fontFamily: "Helvetica-Bold" }]}>Aandachtspunten:</Text>
                    <Text style={styles.notesText}>{checklist.aandachtspunten.join(", ")}</Text>
                  </View>
                )}

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
          Dierenasiel Ninove VZW — Rapport R4: Gedragsfiches
        </Text>
      </Page>
    </Document>
  );
}
