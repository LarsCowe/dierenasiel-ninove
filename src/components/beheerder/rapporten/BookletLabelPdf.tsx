import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import "@/lib/pdf/setup";
import type { BookletLabelModel } from "@/lib/animals/booklet-label";

/**
 * Story 10.66 — etiket voor achteraan in het boekje, bij adoptie.
 *
 * Eén PDF-blad = één DYMO 99014-etiket (54 × 101 mm, liggend gelezen). De
 * LabelWriter drukt het via zijn gewone printerdriver; geen DYMO-software nodig.
 *
 * Past de lijst ontwormingen niet op één etiket, dan loopt ze door op het
 * volgende, met naam en chip opnieuw bovenaan (vaste kop) — er valt niets weg.
 */

const MM = 72 / 25.4;
export const LABEL_SIZE: [number, number] = [101 * MM, 54 * MM];

const INKT = "#111";

const styles = StyleSheet.create({
  page: { paddingVertical: 7, paddingHorizontal: 9, fontFamily: "Helvetica", fontSize: 8, color: INKT },

  kop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottom: `0.6 solid ${INKT}`,
    paddingBottom: 2,
    marginBottom: 4,
  },
  naam: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  chip: { fontSize: 8 },

  rij: { flexDirection: "row", marginBottom: 1.5 },
  label: { fontFamily: "Helvetica-Bold", width: 70 },
  waarde: { flex: 1 },
  schrijflijn: { flex: 1, borderBottom: `0.5 solid ${INKT}`, minHeight: 9 },

  kopje: { fontFamily: "Helvetica-Bold", marginTop: 3, marginBottom: 1.5 },
  ontworming: { flexDirection: "row", marginBottom: 1 },
  datum: { width: 52 },
  product: { flex: 1 },
  geen: { fontFamily: "Helvetica-Oblique" },
});

export default function BookletLabelPdf({ etiket }: { etiket: BookletLabelModel }) {
  return (
    <Document>
      <Page size={LABEL_SIZE} style={styles.page}>
        <View style={styles.kop} fixed>
          <Text style={styles.naam}>{etiket.naam}</Text>
          <Text style={styles.chip}>{etiket.chip ? `Chip ${etiket.chip}` : ""}</Text>
        </View>

        <View style={styles.rij}>
          <Text style={styles.label}>Gesteriliseerd:</Text>
          {etiket.steriel ? (
            <Text style={styles.waarde}>{etiket.steriel}</Text>
          ) : (
            <View style={styles.schrijflijn} />
          )}
        </View>

        <Text style={styles.kopje}>Ontwormingen</Text>
        {etiket.ontwormingen.length === 0 ? (
          <Text style={styles.geen}>Geen ontwormingen geregistreerd</Text>
        ) : (
          etiket.ontwormingen.map((o, i) => (
            <View key={i} style={styles.ontworming} wrap={false}>
              <Text style={styles.datum}>{o.datum}</Text>
              <Text style={styles.product}>{o.product}</Text>
            </View>
          ))
        )}
      </Page>
    </Document>
  );
}
