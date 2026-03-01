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
