import httpx
import logging
from typing import Optional
from supabase._async.client import AsyncClient, create_client as acreate_client
from supabase.lib.client_options import AsyncClientOptions

from .config import settings

# Setup basic logging to help user see issues in their terminal
logger = logging.getLogger("app.database")

# Shared Async HTTP client and Supabase instances
_async_httpx_client: httpx.AsyncClient | None = None
_supabase_anon: AsyncClient | None = None
_supabase_admin: AsyncClient | None = None

def get_async_httpx_client() -> httpx.AsyncClient:
    global _async_httpx_client
    if _async_httpx_client is None:
        # 30s overall timeout, 15s for connection
        # trust_env=False avoids picking up problematic Windows system/IE proxies
        # http2=False forces HTTP/1.1 which is safer on some Windows/VPN setups
        timeout = httpx.Timeout(30.0, connect=15.0)
        _async_httpx_client = httpx.AsyncClient(
            timeout=timeout, 
            follow_redirects=True, 
            trust_env=False,
            http2=False 
        )
    return _async_httpx_client

async def get_supabase_client(anon: bool = True) -> AsyncClient:
    global _supabase_anon, _supabase_admin

    url = settings.SUPABASE_URL.strip().strip('"').strip("'")
    
    if anon:
        if _supabase_anon is None:
            options = AsyncClientOptions(httpx_client=get_async_httpx_client())
            _supabase_anon = await acreate_client(
                url, 
                settings.SUPABASE_ANON_KEY.strip().strip('"'),
                options=options
            )
        return _supabase_anon

    if not settings.SUPABASE_SERVICE_ROLE_KEY:
        from fastapi import HTTPException
        logger.error("SUPABASE_SERVICE_ROLE_KEY is missing from environment variables")
        raise HTTPException(
            status_code=500, 
            detail="Backend configuration error: SUPABASE_SERVICE_ROLE_KEY is missing. Please check Vercel environment variables."
        )

    if _supabase_admin is None:
        options = AsyncClientOptions(httpx_client=get_async_httpx_client())
        _supabase_admin = await acreate_client(
            url, 
            settings.SUPABASE_SERVICE_ROLE_KEY.strip().strip('"'),
            options=options
        )
    return _supabase_admin

async def close_clients():
    global _async_httpx_client, _supabase_anon, _supabase_admin
    if _async_httpx_client:
        await _async_httpx_client.aclose()
        _async_httpx_client = None
    _supabase_anon = None
    _supabase_admin = None
