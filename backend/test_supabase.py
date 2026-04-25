import asyncio
from app.database import get_supabase_client

async def test():
    admin = await get_supabase_client(anon=False)
    # Just try to build the query to see if .select() throws an attribute error
    try:
        q = admin.table("stories").update({"status": "deleted"}).eq("id", 50).select()
        print("Select method works on update query:", q)
    except Exception as e:
        print("Error with select():", type(e), str(e))

asyncio.run(test())
