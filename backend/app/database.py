"""Database abstraction layer supporting MongoDB with seamless SQLite fallback."""
import json
import logging
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
import aiosqlite
from app.config import settings

logger = logging.getLogger("cardio.database")

class DatabaseRepository:
    def __init__(self):
        self.mode = "sqlite"
        self.mongo_client = None
        self.mongo_db = None
        self.sqlite_path = settings.SQLITE_DB_PATH

    async def connect(self):
        """Attempt to connect to MongoDB; fall back to SQLite if unreachable."""
        if not settings.USE_SQLITE_FALLBACK:
            try:
                from motor.motor_asyncio import AsyncIOMotorClient
                self.mongo_client = AsyncIOMotorClient(settings.MONGODB_URL, serverSelectionTimeoutMS=1500)
                await self.mongo_client.admin.command('ping')
                self.mongo_db = self.mongo_client[settings.MONGODB_DB_NAME]
                self.mode = "mongo"
                logger.info("Connected to MongoDB successfully.")
                return
            except Exception as e:
                logger.warning(f"MongoDB connection failed: {e}. Falling back to SQLite.")

        # SQLite mode
        self.mode = "sqlite"
        async with aiosqlite.connect(self.sqlite_path) as db:
            await db.execute("""
                CREATE TABLE IF NOT EXISTS collections (
                    collection TEXT,
                    id TEXT PRIMARY KEY,
                    data TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            await db.execute("CREATE INDEX IF NOT EXISTS idx_coll_name ON collections(collection)")
            await db.commit()
        logger.info(f"Using local persistent SQLite storage at {self.sqlite_path}.")

    async def insert_one(self, collection: str, doc: Dict[str, Any]) -> str:
        doc = dict(doc)
        if "_id" not in doc:
            doc["_id"] = str(uuid.uuid4())
        doc_id = str(doc["_id"])
        if "created_at" not in doc:
            doc["created_at"] = datetime.utcnow().isoformat()

        if self.mode == "mongo" and self.mongo_db is not None:
            await self.mongo_db[collection].insert_one(doc)
            return doc_id

        async with aiosqlite.connect(self.sqlite_path) as db:
            data_json = json.dumps(doc, default=str)
            await db.execute(
                "INSERT OR REPLACE INTO collections (collection, id, data, created_at) VALUES (?, ?, ?, ?)",
                (collection, doc_id, data_json, doc.get("created_at", datetime.utcnow().isoformat()))
            )
            await db.commit()
        return doc_id

    async def find_one(self, collection: str, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        if self.mode == "mongo" and self.mongo_db is not None:
            res = await self.mongo_db[collection].find_one(query)
            if res and "_id" in res:
                res["_id"] = str(res["_id"])
            return res

        async with aiosqlite.connect(self.sqlite_path) as db:
            cursor = await db.execute("SELECT data FROM collections WHERE collection = ?", (collection,))
            rows = await cursor.fetchall()
            for (data_str,) in rows:
                try:
                    item = json.loads(data_str)
                    match = True
                    for k, v in query.items():
                        if item.get(k) != v:
                            match = False
                            break
                    if match:
                        return item
                except Exception:
                    continue
        return None

    async def find_many(
        self, collection: str, query: Optional[Dict[str, Any]] = None,
        sort_field: Optional[str] = "created_at", descending: bool = True, limit: int = 100
    ) -> List[Dict[str, Any]]:
        if query is None:
            query = {}

        if self.mode == "mongo" and self.mongo_db is not None:
            direction = -1 if descending else 1
            cursor = self.mongo_db[collection].find(query).sort(sort_field, direction).limit(limit)
            items = []
            async for doc in cursor:
                doc["_id"] = str(doc["_id"])
                items.append(doc)
            return items

        results = []
        async with aiosqlite.connect(self.sqlite_path) as db:
            cursor = await db.execute("SELECT data FROM collections WHERE collection = ?", (collection,))
            rows = await cursor.fetchall()
            for (data_str,) in rows:
                try:
                    item = json.loads(data_str)
                    match = True
                    for k, v in query.items():
                        if item.get(k) != v:
                            match = False
                            break
                    if match:
                        results.append(item)
                except Exception:
                    continue

        if sort_field:
            results.sort(key=lambda x: x.get(sort_field, ""), reverse=descending)
        return results[:limit]

    async def update_one(self, collection: str, query: Dict[str, Any], update_data: Dict[str, Any], upsert: bool = False) -> bool:
        doc = await self.find_one(collection, query)
        if doc is None:
            if upsert:
                new_doc = {**query, **update_data}
                await self.insert_one(collection, new_doc)
                return True
            return False

        doc.update(update_data)
        doc["updated_at"] = datetime.utcnow().isoformat()

        if self.mode == "mongo" and self.mongo_db is not None:
            await self.mongo_db[collection].update_one(query, {"$set": doc}, upsert=upsert)
            return True

        async with aiosqlite.connect(self.sqlite_path) as db:
            doc_id = str(doc.get("_id", uuid.uuid4()))
            data_json = json.dumps(doc, default=str)
            await db.execute(
                "UPDATE collections SET data = ? WHERE collection = ? AND id = ?",
                (data_json, collection, doc_id)
            )
            await db.commit()
        return True

    async def delete_one(self, collection: str, query: Dict[str, Any]) -> bool:
        doc = await self.find_one(collection, query)
        if not doc:
            return False

        if self.mode == "mongo" and self.mongo_db is not None:
            await self.mongo_db[collection].delete_one(query)
            return True

        doc_id = str(doc.get("_id"))
        async with aiosqlite.connect(self.sqlite_path) as db:
            await db.execute("DELETE FROM collections WHERE collection = ? AND id = ?", (collection, doc_id))
            await db.commit()
        return True

db = DatabaseRepository()