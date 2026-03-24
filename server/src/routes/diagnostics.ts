import { Router } from "express";
import type {
  AdminDiagnosticsResponse,
  AuditLogRecord,
  FailedApiCallRecord,
  NotificationLogRecord,
  SystemStatusResponse
} from "@medical-camp/shared";
import { NotificationStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { requireAuth, requireRoles } from "../middleware/auth";
import { failedApiCallsCount, listFailedApiCalls } from "../services/runtime-diagnostics";
import { getSystemHealthSnapshot } from "../services/system-status";
import { mapNotificationLog } from "../utils/mappers";

const parseDetailsJson = (detailsJson: string | null) => {
  if (!detailsJson) {
    return null;
  }

  try {
    return JSON.parse(detailsJson) as Record<string, unknown>;
  } catch {
    return {
      raw: detailsJson
    };
  }
};

const getQueuedNotifications = async () => {
  const rows = await prisma.notificationLog.findMany({
    where: {
      status: {
        in: [NotificationStatus.FAILED, NotificationStatus.SKIPPED]
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 50
  });

  return rows.map(mapNotificationLog);
};

const getAuditTrail = async (): Promise<AuditLogRecord[]> => {
  const logs = await prisma.auditLog.findMany({
    orderBy: {
      createdAt: "desc"
    },
    take: 50,
    include: {
      actor: {
        select: {
          username: true
        }
      }
    }
  });

  return logs.map((log) => ({
    id: log.id,
    actorId: log.actorId,
    actorRole: log.actorRole ?? undefined,
    actorUsername: log.actor?.username ?? undefined,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    details: parseDetailsJson(log.detailsJson),
    ipAddress: log.ipAddress ?? undefined,
    userAgent: log.userAgent ?? undefined,
    createdAt: log.createdAt.toISOString()
  }));
};

const buildDiagnosticsReport = async (): Promise<AdminDiagnosticsResponse> => {
  const [system, auditLogs, queuedNotifications] = await Promise.all([
    getSystemHealthSnapshot(),
    getAuditTrail(),
    getQueuedNotifications()
  ]);

  const failedApiCalls: FailedApiCallRecord[] = listFailedApiCalls(50);
  const queuedByStatus = queuedNotifications.reduce<Record<string, number>>((accumulator, entry) => {
    accumulator[entry.status] = (accumulator[entry.status] ?? 0) + 1;
    return accumulator;
  }, {});

  return {
    generatedAt: new Date().toISOString(),
    system,
    auditLogs,
    failedApiCalls,
    queuedNotifications,
    summary: {
      failedApiCalls: failedApiCalls.length,
      auditLogs: auditLogs.length,
      queuedNotifications: queuedNotifications.length,
      queuedByStatus
    }
  };
};

const adminSystemRouter = Router();
adminSystemRouter.use(requireAuth, requireRoles("SUPER_ADMIN", "STAFF"));

adminSystemRouter.get("/status", async (request, response) => {
  const [system, queuedNotifications] = await Promise.all([
    getSystemHealthSnapshot(),
    prisma.notificationLog.count({
      where: {
        status: {
          in: [NotificationStatus.FAILED, NotificationStatus.SKIPPED]
        }
      }
    })
  ]);

  const payload: SystemStatusResponse = {
    system,
    auth: {
      authenticated: true,
      adminUsername: request.user?.username,
      role: request.user?.role,
      user: request.user
        ? {
            id: request.user.id,
            username: request.user.username,
            role: request.user.role
          }
        : undefined
    },
    diagnostics: {
      failedApiCallsInMemory: failedApiCallsCount(),
      queuedNotifications
    }
  };

  return response.status(200).json(payload);
});

const adminDiagnosticsRouter = Router();
adminDiagnosticsRouter.use(requireAuth, requireRoles("SUPER_ADMIN", "STAFF"));

adminDiagnosticsRouter.get("/", async (_request, response) => {
  const payload = await buildDiagnosticsReport();
  return response.status(200).json(payload);
});

adminDiagnosticsRouter.get("/export.json", async (_request, response) => {
  const payload = await buildDiagnosticsReport();

  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader(
    "Content-Disposition",
    `attachment; filename="diagnostics-report-${new Date().toISOString().slice(0, 10)}.json"`
  );

  return response.status(200).send(JSON.stringify(payload, null, 2));
});

export { adminSystemRouter, adminDiagnosticsRouter };
