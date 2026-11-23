"""The numbers the Terms and Privacy Policy promise. Change them here and in
frontend/src/data/legal.js together, and bump POLICY_VERSION so everyone is
asked to agree again."""

# Shown on /terms and /privacy, stored with every consent.
# 2026-11-24: added sharing with coaches (Privacy Policy s.5 and s.8).
# 2026-11-24b: parent confirmation by email marked "coming soon" (Privacy s.3 and s.7).
POLICY_VERSION = "2026-11-24b"

# Privacy Policy s.6: a deleted account can be restored for this many days.
DELETION_GRACE_DAYS = 30

# Privacy Policy s.10: complaints and requests are answered within this many days.
RESPONSE_DAYS = 30

# What a person can ask for in writing (everything else is a button that works at once).
REQUEST_KINDS = {
    "grievance": "Privacy complaint",
    "correction": "Correct my data",
    "nominate": "Nominate someone to act for me",
    "question": "Question about my data",
    "guardian": "Request from a parent or guardian",
}

# Things the app does itself, logged as they happen.
ACTION_KINDS = {
    "consent": "Agreed to the Terms and Privacy Policy",
    "export": "Downloaded my data",
    "ai_paused": "Turned AI features off",
    "ai_resumed": "Turned AI features on",
    "delete_report": "Deleted a report",
    "clear_chat": "Cleared my Ask Coach history",
    "delete_requested": "Asked for my account to be deleted",
    "delete_cancelled": "Cancelled account deletion",
    "erased": "Account erased",
    "team_joined": "Joined a team and shared my reports with its coach",
    "team_left": "Left a team; the coach can no longer see my reports",
    "guardian_confirmed": "My parent or guardian confirmed by email",
    "guardian_declined": "My parent or guardian did not agree",
}
