import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { StrayCatCampaign } from "@/types";
import type { CampaignReportStats } from "@/lib/queries/stray-cat-campaigns";
import { CAMPAIGN_STATUS_LABELS, CAMPAIGN_OUTCOME_LABELS, FIV_FELV_STATUS_LABELS } from "@/lib/constants";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { marginBottom: 20, textAlign: "center" },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  org: { fontSize: 9, color: "#666", marginBottom: 2 },
  meta: { marginBottom: 12, paddingBottom: 8, borderBottom: "1 solid #ccc" },
  metaText: { fontSize: 9, color: "#555" },
  statsSection: { marginBottom: 16 },
  statsTitle: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 8 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statCard: { width: "23%", padding: 8, backgroundColor: "#f9fafb", borderRadius: 4, border: "0.5 solid #e5e7eb" },
  statLabel: { fontSize: 7, color: "#6b7280", textTransform: "uppercase" },
  statValue: { fontSize: 14, fontFamily: "Helvetica-Bold", color: "#1b4332", marginTop: 2 },
  table: { marginBottom: 4 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f3f4f6", borderBottom: "0.5 solid #ccc", paddingVertical: 4, paddingHorizontal: 6 },
  tableRow: { flexDirection: "row", borderBottom: "0.5 solid #eee", paddingVertical: 3, paddingHorizontal: 6 },
  headerText: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#374151" },
  cellText: { fontSize: 7 },
  colDate: { width: "10%" },
  colMunicipality: { width: "12%" },
  colAddress: { width: "18%" },
  colStatus: { width: "12%" },
  colFiv: { width: "8%" },
  colFelv: { width: "8%" },
  colOutcome: { width: "18%" },
  colRemarks: { width: "14%" },
  footer: { position: "absolute", bottom: 30, left: 40, right: 40, textAlign: "center", fontSize: 8, color: "#999" },
  empty: { fontSize: 9, color: "#999", fontStyle: "italic", paddingVertical: 8, textAlign: "center" },
});

function statusLabel(status: string): string {
  return CAMPAIGN_STATUS_LABELS[status as keyof typeof CAMPAIGN_STATUS_LABELS] ?? status;
}

function fivFelvLabel(value: string | null): string {
  if (!value) return "-";
  return FIV_FELV_STATUS_LABELS[value as keyof typeof FIV_FELV_STATUS_LABELS] ?? value;
}

function outcomeLabel(value: string | null): string {
  if (!value) return "-";
  return CAMPAIGN_OUTCOME_LABELS[value as keyof typeof CAMPAIGN_OUTCOME_LABELS] ?? value;
}

interface Props {
  campaigns: StrayCatCampaign[];
  stats: CampaignReportStats;
  filters?: string;
  generatedAt: string;
}

export default function StrayCatCampaignsPdf({ campaigns, stats, filters, generatedAt }: Props) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.org}>Dierenasiel Ninove VZW</Text>
          <Text style={styles.org}>Minnenhofstraat 24, 9400 Denderwindeke</Text>
          <Text style={styles.title}>Zwerfkattenbeleid</Text>
        </View>

        <View style={styles.meta}>
          <Text style={styles.metaText}>Gegenereerd op: {generatedAt}</Text>
          {filters && <Text style={styles.metaText}>Filters: {filters}</Text>}
          <Text style={styles.metaText}>Aantal campagnes: {stats.total}</Text>
        </View>

        {/* Statistieken */}
        <View style={styles.statsSection}>
          <Text style={styles.statsTitle}>Samenvatting</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Totaal campagnes</Text>
              <Text style={styles.statValue}>{stats.total}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Afgeronde campagnes</Text>
              <Text style={styles.statValue}>{stats.completedCampaigns}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>FIV positief</Text>
              <Text style={styles.statValue}>{stats.fivPositive} ({stats.fivPercentage}%)</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>FeLV positief</Text>
              <Text style={styles.statValue}>{stats.felvPositive} ({stats.felvPercentage}%)</Text>
            </View>
          </View>
          {Object.keys(stats.outcomes).length > 0 && (
            <View style={[styles.statsGrid, { marginTop: 8 }]}>
              {Object.entries(stats.outcomes).map(([key, count]) => (
                <View key={key} style={styles.statCard}>
                  <Text style={styles.statLabel}>{outcomeLabel(key)}</Text>
                  <Text style={styles.statValue}>{count}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Detail tabel */}
        {campaigns.length === 0 ? (
          <Text style={styles.empty}>Geen campagnes gevonden voor deze filters.</Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.colDate, styles.headerText]}>Datum</Text>
              <Text style={[styles.colMunicipality, styles.headerText]}>Gemeente</Text>
              <Text style={[styles.colAddress, styles.headerText]}>Adres</Text>
              <Text style={[styles.colStatus, styles.headerText]}>Status</Text>
              <Text style={[styles.colFiv, styles.headerText]}>FIV</Text>
              <Text style={[styles.colFelv, styles.headerText]}>FeLV</Text>
              <Text style={[styles.colOutcome, styles.headerText]}>Uitkomst</Text>
              <Text style={[styles.colRemarks, styles.headerText]}>Opmerkingen</Text>
            </View>
            {campaigns.map((campaign) => (
              <View key={campaign.id} style={styles.tableRow}>
                <Text style={[styles.colDate, styles.cellText]}>{campaign.requestDate}</Text>
                <Text style={[styles.colMunicipality, styles.cellText]}>{campaign.municipality}</Text>
                <Text style={[styles.colAddress, styles.cellText]}>{campaign.address}</Text>
                <Text style={[styles.colStatus, styles.cellText]}>{statusLabel(campaign.status)}</Text>
                <Text style={[styles.colFiv, styles.cellText]}>{fivFelvLabel(campaign.fivStatus)}</Text>
                <Text style={[styles.colFelv, styles.cellText]}>{fivFelvLabel(campaign.felvStatus)}</Text>
                <Text style={[styles.colOutcome, styles.cellText]}>{outcomeLabel(campaign.outcome)}</Text>
                <Text style={[styles.colRemarks, styles.cellText]}>{campaign.remarks ?? "-"}</Text>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.footer}>
          Dierenasiel Ninove VZW — Rapport R14: Zwerfkattenbeleid
        </Text>
      </Page>
    </Document>
  );
}
