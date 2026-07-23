"use client";

import { useState, useEffect, useCallback } from "react";
import {
  GitBranch,
  Download,
  Eye,
  GitCompare,
  Loader2,
  CheckCircle2,
  Film,
} from "lucide-react";
import { toast } from "sonner";

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { SectionTitle } from "@/components/shared/section-title";
import { VersionCompare } from "@/components/projects/version-compare";
import { getVersionHistoryAction, type VideoVersion } from "@/actions/projects/get-version-history";
import { formatDate, formatBytes } from "@/lib/utils/format";
import { formatDuration } from "@/lib/video/metadata";

/* ============================================
   VersionHistory — Video version timeline
   Derives versions from videos ordered by
   createdAt. Each version can be viewed,
   downloaded, or compared.
   ============================================ */

type VersionHistoryProps = {
  projectId: string;
};

export function VersionHistory({ projectId }: VersionHistoryProps) {
  const [versions, setVersions] = useState<VideoVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareVersionA, setCompareVersionA] = useState<VideoVersion | null>(null);
  const [compareVersionB, setCompareVersionB] = useState<VideoVersion | null>(null);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      const result = await getVersionHistoryAction(projectId);
      if (!active) return;
      setVersions(result);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [projectId, refreshKey]);

  const handleDownload = useCallback(async (version: VideoVersion) => {
    if (!version.downloadUrl) {
      toast.error("التحميل غير متاح لهذا الإصدار");
      return;
    }
    window.open(version.downloadUrl, "_blank");
  }, []);

  const handleView = useCallback((version: VideoVersion) => {
    if (!version.streamUrl) {
      toast.error("المعاينة غير متاحة");
      return;
    }
    window.open(version.streamUrl, "_blank");
  }, []);

  const handleCompare = useCallback((version: VideoVersion) => {
    if (versions.length < 2) {
      toast.error("تحتاج إصدارين على الأقل للمقارنة");
      return;
    }
    // Compare with the latest version
    const latest = versions[versions.length - 1];
    if (!latest) return;
    if (version.id === latest.id) {
      // If clicking latest, compare with previous
      const prev = versions[versions.length - 2];
      if (!prev) return;
      setCompareVersionA(prev);
      setCompareVersionB(latest);
    } else {
      setCompareVersionA(version);
      setCompareVersionB(latest);
    }
    setCompareOpen(true);
  }, [versions]);

  if (loading) {
    return (
      <DashboardCard className="p-6">
        <SectionTitle title="سجل الإصدارات" />
        <div className="mt-4 space-y-2">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      </DashboardCard>
    );
  }

  if (versions.length === 0) {
    return null;
  }

  return (
    <>
      <DashboardCard className="p-6">
        <div className="flex items-center justify-between">
          <SectionTitle title="سجل الإصدارات" />
          <Badge variant="outline" className="gap-1">
            <GitBranch className="h-3 w-3" />
            {versions.length} إصدار
          </Badge>
        </div>

        {/* Version list */}
        <div className="mt-4 space-y-2">
          {versions.slice().reverse().map((version, idx) => (
            <div
              key={version.id}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/30"
            >
              {/* Version number */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <span className="text-sm font-bold text-primary">
                  V{version.version}
                </span>
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-medium">{version.title}</p>
                  {version.isCurrent && (
                    <Badge className="shrink-0 bg-green-600 hover:bg-green-600">
                      <CheckCircle2 className="h-3 w-3" />
                      الحالي
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(version.createdAt)}</span>
                  <span>·</span>
                  <span>{formatBytes(version.fileSize)}</span>
                  {version.duration && (
                    <>
                      <span>·</span>
                      <span>{formatDuration(version.duration)}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleView(version)}
                  aria-label="عرض"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDownload(version)}
                  disabled={!version.downloadUrl}
                  aria-label="تحميل"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleCompare(version)}
                  disabled={versions.length < 2}
                  aria-label="مقارنة"
                >
                  <GitCompare className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DashboardCard>

      {/* Version compare modal */}
      {compareOpen && compareVersionA && compareVersionB && (
        <VersionCompare
          versionA={compareVersionA}
          versionB={compareVersionB}
          versions={versions}
          onClose={() => setCompareOpen(false)}
          onSelectA={setCompareVersionA}
          onSelectB={setCompareVersionB}
        />
      )}
    </>
  );
}
