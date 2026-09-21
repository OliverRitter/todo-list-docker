import type { NextFunction, Request, Response } from "express";
import { parse as parseCookie } from "cookie-es";
import { sql } from "drizzle-orm";
import { db } from "../db/client.js";

export interface AuthenticatedUser {
  userId: string;
  userName: string;
}

export async function getAuthenticatedUser(
  cookieHeader: string | undefined,
): Promise<AuthenticatedUser | null> {
  if (!cookieHeader) return null;

  const parsed = parseCookie(cookieHeader);
  const rawToken = parsed["better-auth.session_token"];
  if (!rawToken) return null;

  const sessionToken = rawToken.split(".").at(0) || rawToken;
  const sessionResult = await db.execute(sql`
    SELECT s.user_id, u.name as user_name
    FROM "session" s
    INNER JOIN "user" u ON s.user_id = u.id
    WHERE s.token = ${sessionToken} AND s.expires_at > CURRENT_TIMESTAMP
    LIMIT 1;
  `);

  const activeRow = sessionResult.rows.at(0);
  if (!activeRow) return null;

  return {
    userId: String(activeRow.user_id),
    userName: String(activeRow.user_name),
  };
}

export async function requireAuthenticatedUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authenticatedUser = await getAuthenticatedUser(req.headers.cookie);
    if (!authenticatedUser) {
      return res.status(401).json({ error: "Authentication required" });
    }

    res.locals.userId = authenticatedUser.userId;
    return next();
  } catch (error) {
    console.error("HTTP authentication failure:", error);
    return res.status(500).json({ error: "Authentication service error" });
  }
}
