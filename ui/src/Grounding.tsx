import type { Draft, Result } from "./service";
export function pendingClaims(
  draft: Draft,
  themes: Result["missing_themes"] = [],
) {
  return (draft.claims || []).filter((claim) => {
    const index = /missing_themes\[(\d+)\]/.exec(claim.evidence_ref);
    const theme = index ? themes[Number(index[1])] : null;
    const check = theme
      ? draft.missing_checks?.find((c) => c.theme === theme.theme)?.status
      : undefined;
    return (
      check === "uncorroborated" ||
      (theme &&
        ["single-source", "uncorroborated", "not checked"].includes(
          theme.corroboration,
        ))
    );
  });
}
export function DraftNarrative({
  draft,
  themes,
}: {
  draft: Draft;
  themes?: Result["missing_themes"];
}) {
  const pending = pendingClaims(draft, themes);
  return (
    <>
      <div className="draft-text">
        {draft.claims?.length ? (
          draft.claims
            .filter((c) => !pending.includes(c))
            .map((claim) => <p key={claim.claim_id}>{claim.text}</p>)
        ) : (
          <p>{draft.rationale_md}</p>
        )}
      </div>
      {pending.length > 0 && (
        <div className="to-verify">
          <h3>To verify before inclusion</h3>
          {pending.map((c) => (
            <p key={c.claim_id}>
              {c.claim_id}: {c.text}
            </p>
          ))}
          <p>
            These source claims are not corroborated. The API draft must remove
            or corroborate them before approval. They remain visible here for
            review.
          </p>
        </div>
      )}
    </>
  );
}
