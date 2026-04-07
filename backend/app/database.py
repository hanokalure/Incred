from supabase import Client, create_client

from .config import settings

_supabase_anon: Client | None = None
_supabase_admin: Client | None = None


def get_supabase_client(anon: bool = True) -> Client:
    global _supabase_anon, _supabase_admin

    if anon:
        if _supabase_anon is None:
            _supabase_anon = create_client(settings.SUPABASE_URL, settings.SUPABASE_ANON_KEY)
        return _supabase_anon

    if not settings.SUPABASE_SERVICE_ROLE_KEY:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY is required for server-side operations")

    if _supabase_admin is None:
        _supabase_admin = create_client(settings.SUPABASE_URL, settings.SUPABASE_SERVICE_ROLE_KEY)
    return _supabase_admin


class LazySupabaseClient:
    def __init__(self, anon: bool):
        self.anon = anon

    def __getattr__(self, name):
        client = get_supabase_client(anon=self.anon)
        return getattr(client, name)


supabase_anon = LazySupabaseClient(anon=True)
supabase_admin = LazySupabaseClient(anon=False)
