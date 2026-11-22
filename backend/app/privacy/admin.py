"""For the SkillLens team: see and answer privacy complaints and requests.

    python -m app.privacy.admin                  list open requests, soonest due first
    python -m app.privacy.admin resolve 12 "We corrected your sport to Tennis."
    python -m app.privacy.admin erase-due        carry out deletions whose 30 days are up

Run it with the production DATABASE_URL set (for example in the Render shell).
The person sees the answer under Privacy & data in the app.
"""
import sys

from app.db import session as dbs
from app.privacy import service


def main(argv: list[str]) -> int:
    dbs.get_engine()
    with dbs._SessionLocal() as db:
        if not argv:
            rows = service.open_requests(db)
            if not rows:
                print("No open privacy requests.")
            for r in rows:
                print(f"#{r.id}  {service.label(r.kind)}  due {r.due_by:%d %b %Y}  user {r.user_id}")
                print(f"     {r.details}\n")
            return 0
        if argv[0] == "resolve" and len(argv) == 3:
            row = service.resolve(db, int(argv[1]), argv[2])
            print("Resolved." if row else "No such request.")
            return 0 if row else 1
        if argv[0] == "erase-due":
            print(f"Erased {service.erase_due(db)} account(s).")
            return 0
    print(__doc__)
    return 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
