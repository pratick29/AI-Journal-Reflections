# Security Specification: AI Journal & Reflections

## 1. Data Invariants
- An interaction can ONLY exist under `/users/{userId}/interactions/{interactionId}` where `request.auth.uid == userId`.
- No user can read, query, list, modify, or delete another user's interactions under any circumstances.
- An unauthenticated client (`request.auth == null`) has ZERO read or write access across the entire database.
- Every created interaction must have `userId == request.auth.uid`.
- Document ID path variables must satisfy alphanumeric length boundaries (`isValidId`).
- Payloads must strip all `undefined` values before persistence to prevent schema corruptions.
- The server-side Gemini API key must never be passed to the browser or stored in Firestore.

## 2. The "Dirty Dozen" Malicious Payloads Checked Against Rules
1. **Cross-User Snooping**: User A attempts `getDoc(doc(db, 'users', 'userB', 'interactions', 'int1'))` -> REJECTED (Permission Denied).
2. **Cross-User List/Query**: User A attempts `getDocs(collection(db, 'users', 'userB', 'interactions'))` -> REJECTED.
3. **Cross-User Infiltration**: User A attempts `setDoc(doc(db, 'users', 'userB', 'interactions', 'int1'), { ... })` -> REJECTED.
4. **Unauthenticated Read**: Anonymous client attempts read without auth -> REJECTED.
5. **Unauthenticated Write**: Anonymous client attempts write without auth -> REJECTED.
6. **Path Traversal / ID Poisoning**: Attempt to write with a 2KB junk character ID -> REJECTED via `isValidId()`.
7. **Identity Spoofing**: User A writes to `/users/userA/interactions/int1` but sets `userId: 'userB'` -> REJECTED.
8. **Catch-All Probe**: Attempt to query non-existent collection `/secrets` or `/admin` -> REJECTED by default-deny catch-all rule.
9. **Oversized String Injection**: Injecting a 20MB string into `title` or `summary` -> REJECTED by length guards.
10. **Array Explosion Attack**: Injecting 10,000 items in `tags` -> REJECTED by size bounds.
11. **Client-Side Admin Bypass**: Passing forged client token claims -> REJECTED (no client claims accepted).
12. **Malicious Prototype / Undefined Fields**: Database ingestion sanitizer strips invalid properties before committing write.
