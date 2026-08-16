from app.core.database import SessionLocal
from app.services.wallet import backfill_wallet_ledger


def main() -> None:
    db = SessionLocal()
    try:
        result = backfill_wallet_ledger(db, dry_run=False)
        print(result)
    finally:
        db.close()


if __name__ == "__main__":
    main()
