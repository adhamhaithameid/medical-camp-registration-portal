import type { Request } from "express";
import type { AdminRole } from "@prisma/client";
import { prisma } from "../config/prisma";

interface AuditInput {
  request: Request;
  action: string;
  entityType: string;
  entityId: string;
  details?: Record<string, unknown>;
  actorOverride?: {
    id: number;
    role: AdminRole;
  };
}

export const recordAudit = async (input: AuditInput) => {
  const actorId = input.actorOverride?.id ?? input.request.user?.id;
  const actorRole = input.actorOverride?.role ?? input.request.user?.role;

  try {
    await prisma.auditLog.create({
      data: {
        actorId,
        actorRole,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        detailsJson: input.details ? JSON.stringify(input.details) : undefined,
        ipAddress: input.request.ip,
        userAgent: input.request.headers["user-agent"]
      }
    });
  } catch {
    // Audit logging should never break business requests.
  }
};
