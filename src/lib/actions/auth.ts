"use server";

import { setGuestCookie } from "@/lib/auth/session";

export async function loginAsGuest() {
  await setGuestCookie();
}
