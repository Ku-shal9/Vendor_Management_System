import { ExternalLink, FileText } from "lucide-react";
import { Registration } from "../types.js";

interface RegistrationDocumentsProps {
  registrationId: string;
  documents?: Registration["documents"];
  compact?: boolean;
}

function docHref(registrationId: string, type: "license" | "w9") {
  return `/api/registrations/${registrationId}/documents/${type}`;
}

export default function RegistrationDocuments({
  registrationId,
  documents,
  compact = false,
}: RegistrationDocumentsProps) {
  if (!documents?.license && !documents?.w9) return null;

  const linkClass = compact
    ? "inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:text-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded"
    : "inline-flex items-center gap-1.5 px-3 py-1.5 bg-surface-muted border border-border rounded-lg text-xs font-semibold text-ink hover:border-primary/40 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary";

  return (
    <div className={compact ? "flex flex-wrap items-center gap-2 mt-1" : "flex flex-wrap gap-3"}>
      {documents.license && (
        <a
          href={docHref(registrationId, "license")}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          title={documents.license}
        >
          <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          {compact ? "View license" : `License: ${documents.license}`}
          {!compact && <ExternalLink className="w-3 h-3 shrink-0 opacity-60" aria-hidden="true" />}
        </a>
      )}
      {documents.w9 && (
        <a
          href={docHref(registrationId, "w9")}
          target="_blank"
          rel="noopener noreferrer"
          className={linkClass}
          title={documents.w9}
        >
          <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          {compact ? "View W-9" : `W-9: ${documents.w9}`}
          {!compact && <ExternalLink className="w-3 h-3 shrink-0 opacity-60" aria-hidden="true" />}
        </a>
      )}
    </div>
  );
}
