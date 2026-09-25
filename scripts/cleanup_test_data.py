import os
import re
from pathlib import Path

from dotenv import load_dotenv
from pymongo import MongoClient


def main():
    root = Path(__file__).resolve().parents[1]
    load_dotenv(root / "backend" / ".env")
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    if not mongo_url or not db_name:
        print("Missing MONGO_URL or DB_NAME")
        return 1

    client = MongoClient(mongo_url)
    db = client[db_name]

    email_patterns = [
        re.compile(r"^test\.teacher1\..+@example\.com$"),
        re.compile(r"^test\.teacher2\..+@example\.com$"),
        re.compile(r"^test\.student\..+@example\.com$"),
        re.compile(r"^uitest\.teacher\..+@example\.com$"),
        re.compile(r"^uitest\.student\..+@example\.com$"),
    ]

    users = list(db.users.find({"email": {"$in": []}}, {"_id": 0}))
    # query all then filter by regex to keep compatibility with regex array
    users = [u for u in db.users.find({}, {"_id": 0}) if any(p.match(u.get("email", "")) for p in email_patterns)]
    owner_ids = [u["id"] for u in users]

    print(f"Matched test users: {len(users)}")
    for u in users:
        print(f" - {u.get('id')} | {u.get('email')} | {u.get('role')}")

    if not owner_ids:
        print("No matching users found.")
        return 0

    for coll in ["students", "texts", "sessions", "games", "practices", "audit"]:
        result = db[coll].delete_many({"owner_id": {"$in": owner_ids}})
        print(f"Deleted {result.deleted_count} from {coll}")

    db.audit.delete_many({"user_id": {"$in": owner_ids}})

    token_result = db.tokens.delete_many({"user_id": {"$in": owner_ids}})
    user_result = db.users.delete_many({"id": {"$in": owner_ids}})
    print(f"Deleted {token_result.deleted_count} tokens")
    print(f"Deleted {user_result.deleted_count} users")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
