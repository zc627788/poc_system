from __future__ import annotations

import argparse
import sys
import time
from pathlib import Path

from sqlalchemy.exc import OperationalError


CURRENT_FILE = Path(__file__).resolve()
SERVER_ROOT = CURRENT_FILE.parents[1]
if str(SERVER_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVER_ROOT))

from app.core.database import SessionLocal
from app.services.prepaid_billing import backfill_paid_prepaid_orders


RETRYABLE_DB_ERROR_CODES = {1205, 1213}


def _is_retryable_operational_error(exc: OperationalError) -> bool:
    args = getattr(getattr(exc, "orig", None), "args", ())
    return bool(args) and args[0] in RETRYABLE_DB_ERROR_CODES


def main() -> int:
    parser = argparse.ArgumentParser(description="Backfill prepaid credit ledger entries for paid PREPAID orders.")
    parser.add_argument("--dry-run", action="store_true", help="Only calculate how many ledger entries would be inserted.")
    parser.add_argument("--max-retries", type=int, default=3, help="Retry count for transient MySQL lock/deadlock errors.")
    args = parser.parse_args()

    attempt = 0
    while True:
        db = SessionLocal()
        try:
            result = backfill_paid_prepaid_orders(db, dry_run=args.dry_run)
            break
        except OperationalError as exc:
            db.rollback()
            attempt += 1
            if attempt >= max(args.max_retries, 1) or not _is_retryable_operational_error(exc):
                raise
            time.sleep(min(0.2 * attempt, 1.0))
        finally:
            db.close()

    mode = "DRY-RUN" if args.dry_run else "APPLIED"
    print(f"[{mode}] scanned_orders={result.scanned_orders} inserted_entries={result.inserted_entries}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
