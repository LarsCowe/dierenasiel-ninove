import { Document, Page, Text, View, Image, StyleSheet } from "@react-pdf/renderer";
import type { StrayCatCampaign } from "@/types";
import type { CampaignReportStats } from "@/lib/queries/stray-cat-campaigns";
import { CAMPAIGN_OUTCOME_LABELS, FIV_FELV_STATUS_LABELS } from "@/lib/constants";

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 9, fontFamily: "Helvetica" },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 },
  headerLeft: { flex: 1, paddingRight: 12 },
  headerRight: { width: 80, alignItems: "flex-end" },
  org: { fontSize: 9, color: "#666" },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", color: "#1b4332", marginTop: 4 },
  subtitle: { fontSize: 11, color: "#1b4332", marginTop: 2 },
  logo: { width: 75, height: 75, objectFit: "contain" },
  meta: { marginBottom: 10, paddingBottom: 6, borderBottom: "1 solid #ccc" },
  metaText: { fontSize: 8, color: "#555" },
  statsRow: { flexDirection: "row", gap: 6, marginBottom: 12 },
  statCard: { flex: 1, padding: 6, backgroundColor: "#f9fafb", borderRadius: 3, border: "0.5 solid #e5e7eb" },
  statLabel: { fontSize: 6, color: "#6b7280", textTransform: "uppercase" },
  statValue: { fontSize: 11, fontFamily: "Helvetica-Bold", color: "#1b4332", marginTop: 2 },
  table: { marginBottom: 4 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f3f4f6", borderBottom: "0.5 solid #ccc", paddingVertical: 4, paddingHorizontal: 4 },
  tableRow: { flexDirection: "row", borderBottom: "0.5 solid #eee", paddingVertical: 3, paddingHorizontal: 4 },
  headerText: { fontSize: 7, fontFamily: "Helvetica-Bold", color: "#374151" },
  cellText: { fontSize: 7 },
  colDate: { width: "8%" },
  colMunicipality: { width: "10%" },
  colAddress: { width: "16%" },
  colCage: { width: "12%" },
  colInspection: { width: "8%" },
  colCat: { width: "13%" },
  colVet: { width: "10%" },
  colFiv: { width: "7%" },
  colOutcome: { width: "9%" },
  colRemarks: { width: "7%" },
  footer: { position: "absolute", bottom: 20, left: 30, right: 30, textAlign: "center", fontSize: 7, color: "#999" },
  empty: { fontSize: 9, color: "#999", fontStyle: "italic", paddingVertical: 8, textAlign: "center" },
});

function fivFelvLabel(value: string | null): string {
  if (!value) return "-";
  return FIV_FELV_STATUS_LABELS[value as keyof typeof FIV_FELV_STATUS_LABELS] ?? value;
}

function outcomeLabel(value: string | null): string {
  if (!value) return "-";
  return CAMPAIGN_OUTCOME_LABELS[value as keyof typeof CAMPAIGN_OUTCOME_LABELS] ?? value;
}

function formatPeriod(dateFrom: string | undefined, dateTo: string | undefined): string {
  if (dateFrom && dateTo) return `${dateFrom} t/m ${dateTo}`;
  if (dateFrom) return `vanaf ${dateFrom}`;
  if (dateTo) return `tot ${dateTo}`;
  return "Alle periodes";
}

function combineCageInfo(campaign: StrayCatCampaign): string {
  const parts: string[] = [];
  if (campaign.cageDeploymentDate) parts.push(campaign.cageDeploymentDate);
  if (campaign.cageNumbers) parts.push(`#${campaign.cageNumbers}`);
  return parts.length > 0 ? parts.join(" ") : "-";
}

function combineFivFelv(campaign: StrayCatCampaign): string {
  const fiv = fivFelvLabel(campaign.fivStatus);
  const felv = fivFelvLabel(campaign.felvStatus);
  return `FIV: ${fiv}\nFeLV: ${felv}`;
}

interface Props {
  campaigns: StrayCatCampaign[];
  stats: CampaignReportStats;
  municipality?: string;
  dateFrom?: string;
  dateTo?: string;
  logoUrl?: string;
  generatedAt: string;
}

export default function StrayCatCampaignsPdf({
  campaigns,
  stats,
  municipality,
  dateFrom,
  dateTo,
  logoUrl,
  generatedAt,
}: Props) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text style={styles.org}>Dierenasiel Ninove VZW</Text>
            <Text style={styles.org}>Minnenhofstraat 24, 9400 Denderwindeke</Text>
            <Text style={styles.title}>R14 — Zwerfkattenbeleid</Text>
            <Text style={styles.subtitle}>
              {municipality ? `Gemeente: ${municipality}` : "Alle gemeentes"}
              {"  ·  "}Periode: {formatPeriod(dateFrom, dateTo)}
            </Text>
          </View>
          {logoUrl && (
            <View style={styles.headerRight}>
              {/* eslint-disable-next-line jsx-a11y/alt-text */}
              <Image src={logoUrl} style={styles.logo} />
            </View>
          )}
        </View>

        <View style={styles.meta}>
          <Text style={styles.metaText}>Gegenereerd op: {generatedAt}</Text>
          <Text style={styles.metaText}>Aantal campagnes: {stats.total}</Text>
        </View>

        {/* Compacte samenvatting */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Totaal</Text>
            <Text style={styles.statValue}>{stats.total}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Afgerond</Text>
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
          {Object.entries(stats.outcomes).slice(0, 3).map(([key, count]) => (
            <View key={key} style={styles.statCard}>
              <Text style={styles.statLabel}>{outcomeLabel(key)}</Text>
              <Text style={styles.statValue}>{count}</Text>
            </View>
          ))}
        </View>

        {/* Detail tabel — log per campagne */}
        {campaigns.length === 0 ? (
          <Text style={styles.empty}>Geen campagnes gevonden voor deze filters.</Text>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.colDate, styles.headerText]}>Datum</Text>
              <Text style={[styles.colMunicipality, styles.headerText]}>Gemeente</Text>
              <Text style={[styles.colAddress, styles.headerText]}>Adres</Text>
              <Text style={[styles.colCage, styles.headerText]}>Kooi-uitzetting</Text>
              <Text style={[styles.colInspection, styles.headerText]}>Inspectie</Text>
              <Text style={[styles.colCat, styles.headerText]}>Kat (beschrijving)</Text>
              <Text style={[styles.colVet, styles.headerText]}>Dierenarts</Text>
              <Text style={[styles.colFiv, styles.headerText]}>FIV / FeLV</Text>
              <Text style={[styles.colOutcome, styles.headerText]}>Uitkomst</Text>
              <Text style={[styles.colRemarks, styles.headerText]}>Opm.</Text>
            </View>
            {campaigns.map((campaign) => (
              <View key={campaign.id} style={styles.tableRow}>
                <Text style={[styles.colDate, styles.cellText]}>{campaign.requestDate}</Text>
                <Text style={[styles.colMunicipality, styles.cellText]}>{campaign.municipality}</Text>
                <Text style={[styles.colAddress, styles.cellText]}>{campaign.address}</Text>
                <Text style={[styles.colCage, styles.cellText]}>{combineCageInfo(campaign)}</Text>
                <Text style={[styles.colInspection, styles.cellText]}>{campaign.inspectionDate ?? "-"}</Text>
                <Text style={[styles.colCat, styles.cellText]}>{campaign.catDescription ?? "-"}</Text>
                <Text style={[styles.colVet, styles.cellText]}>{campaign.vetName ?? "-"}</Text>
                <Text style={[styles.colFiv, styles.cellText]}>{combineFivFelv(campaign)}</Text>
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
