# Privacy engineering (repo page; not in the 3-minute pitch)

1. Who can learn what: see MASTER_PROMPT.md section 1a.
2. Pilot design: restricted identity registry with logged access; stable internal ids; pseudonyms to peers; `anonymous`
   answers stored without identity and not claimable; aggregates only to the public with n >= 5 (disclosure rule).
3. Phase 2, if anonymity from ACAPS itself is required: blind-signed single-use credentials issued by the committee.
   Threat model to write: issuance timing correlation, network metadata, revocation of a credential, scoring without linkage.
4. Research directions (one paragraph each, Lane C): zero-knowledge group membership (Semaphore) for reputation without
   identity; public timestamp anchoring of commitment roots (OpenTimestamps) for independent timing proof; post-quantum
   encryption of the identity registry (ML-KEM) and signed outcome attestations (ML-DSA) against long-horizon disclosure.
   What each guarantees, what it does not, and why none is in the pilot build.
