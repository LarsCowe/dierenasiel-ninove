import { db } from "@/lib/db";
import { strayCatCampaigns, animals } from "@/lib/db/schema";
import { eq, and, desc, gte, lte, sql } from "drizzle-orm";
import { CAMPAIGN_STATUSES } from "@/lib/constants";
import type { StrayCatCampaign } from "@/types";
import type { SQL } from "drizzle-orm";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
function isValidDate(value: string): boolean {
  return DATE_REGEX.test(value) && !isNaN(Date.parse(value));
}
const MAX_PAGE_SIZE = 100;

export interface CampaignListOptions {
  municipality?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface CampaignListResult {
  campaigns: StrayCatCampaign[];
  total: number;
}

export async function getCampaignById(id: number) {
  const rows = await db
    .select()
    .from(strayCatCampaigns)
    .where(eq(strayCatCampaigns.id, id));
  return rows[0] ?? null;
}

export async function getAllCampaigns() {
  return db
    .select()
    .from(strayCatCampaigns)
    .orderBy(desc(strayCatCampaigns.requestDate));
}

export async function getCampaignsForAdmin(
  options: CampaignListOptions = {},
): Promise<CampaignListResult> {
  const { municipality, status, dateFrom, dateTo, page = 1, pageSize = 25 } = options;
  const safePageSize = Math.min(Math.max(1, pageSize), MAX_PAGE_SIZE);

  const conditions: SQL[] = [];
  if (municipality) conditions.push(eq(strayCatCampaigns.municipality, municipality));
  if (status && (CAMPAIGN_STATUSES as readonly string[]).includes(status)) {
    conditions.push(eq(strayCatCampaigns.status, status));
  }
  if (dateFrom && isValidDate(dateFrom)) conditions.push(gte(strayCatCampaigns.requestDate, dateFrom));
  if (dateTo && isValidDate(dateTo)) conditions.push(lte(strayCatCampaigns.requestDate, dateTo));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  try {
    const [results, totalResult] = await Promise.all([
      db
        .select()
        .from(strayCatCampaigns)
        .where(whereClause)
        .orderBy(desc(strayCatCampaigns.requestDate))
        .limit(safePageSize)
        .offset((page - 1) * safePageSize),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(strayCatCampaigns)
        .where(whereClause),
    ]);

    return {
      campaigns: results as StrayCatCampaign[],
      total: (totalResult as { count: number }[])[0]?.count ?? 0,
    };
  } catch (err) {
    console.error("getCampaignsForAdmin query failed:", err);
    return { campaigns: [], total: 0 };
  }
}

export async function getDistinctMunicipalities(): Promise<string[]> {
  try {
    const rows = await db
      .selectDistinct({ municipality: strayCatCampaigns.municipality })
      .from(strayCatCampaigns)
      .orderBy(strayCatCampaigns.municipality);
    return rows.map((r) => r.municipality);
  } catch (err) {
    console.error("getDistinctMunicipalities query failed:", err);
    return [];
  }
}

export interface CampaignReportFilters {
  municipality?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CampaignReportStats {
  total: number;
  completedCampaigns: number;
  fivPositive: number;
  fivTested: number;
  fivPercentage: number;
  felvPositive: number;
  felvTested: number;
  felvPercentage: number;
  outcomes: Record<string, number>;
}

export interface CampaignReportResult {
  campaigns: StrayCatCampaign[];
  stats: CampaignReportStats;
}

export async function getCampaignReport(
  filters: CampaignReportFilters = {},
): Promise<CampaignReportResult> {
  const { municipality, dateFrom, dateTo } = filters;

  const conditions: SQL[] = [];
  if (municipality) conditions.push(eq(strayCatCampaigns.municipality, municipality));
  if (dateFrom && isValidDate(dateFrom)) conditions.push(gte(strayCatCampaigns.requestDate, dateFrom));
  if (dateTo && isValidDate(dateTo)) conditions.push(lte(strayCatCampaigns.requestDate, dateTo));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  try {
    const campaigns = (await db
      .select()
      .from(strayCatCampaigns)
      .where(whereClause)
      .orderBy(desc(strayCatCampaigns.requestDate))) as StrayCatCampaign[];

    const total = campaigns.length;
    const completedCampaigns = campaigns.filter((c) => c.status === "afgerond").length;
    const fivPositive = campaigns.filter((c) => c.fivStatus === "positief").length;
    const fivTested = campaigns.filter((c) => c.fivStatus !== null).length;
    const felvPositive = campaigns.filter((c) => c.felvStatus === "positief").length;
    const felvTested = campaigns.filter((c) => c.felvStatus !== null).length;

    const outcomes: Record<string, number> = {};
    for (const c of campaigns) {
      if (c.outcome) {
        outcomes[c.outcome] = (outcomes[c.outcome] || 0) + 1;
      }
    }

    return {
      campaigns,
      stats: {
        total,
        completedCampaigns,
        fivPositive,
        fivTested,
        fivPercentage: fivTested > 0 ? Math.round((fivPositive / fivTested) * 100) : 0,
        felvPositive,
        felvTested,
        felvPercentage: felvTested > 0 ? Math.round((felvPositive / felvTested) * 100) : 0,
        outcomes,
      },
    };
  } catch (err) {
    console.error("getCampaignReport query failed:", err);
    return {
      campaigns: [],
      stats: {
        total: 0,
        completedCampaigns: 0,
        fivPositive: 0,
        fivTested: 0,
        fivPercentage: 0,
        felvPositive: 0,
        felvTested: 0,
        felvPercentage: 0,
        outcomes: {},
      },
    };
  }
}

export async function getCatsAvailableForLinking() {
  return db
    .select({ id: animals.id, name: animals.name })
    .from(animals)
    .where(
      and(
        eq(animals.species, "kat"),
        eq(animals.isInShelter, true),
      ),
    );
}
