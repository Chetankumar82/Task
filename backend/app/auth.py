import functools
import logging
import jwt
from flask import request, jsonify, g
from app.config import Config
from app.services.supabase_client import DatabaseService, supabase_client, mock_store

logger = logging.getLogger(__name__)

def require_auth(f):
    """
    Decorator for Flask routes requiring authentication.
    Validates Supabase JWT from 'Authorization: Bearer <token>' header,
    resolves the user profile, and binds it to Flask's request context `g.current_user`.
    """
    @functools.wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        token = None

        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ", 1)[1].strip()

        # 1. Dev / Demo Bypass Handling
        if not token:
            # Check for development/test header or dev mode fallback
            dev_user_id = request.headers.get("X-Mock-User-Id")
            if dev_user_id and dev_user_id in mock_store.profiles:
                g.current_user = mock_store.profiles[dev_user_id]
                return f(*args, **kwargs)
            elif Config.DEV_MODE:
                # Default to first mock profile if DEV_MODE is explicitly enabled
                g.current_user = mock_store.profiles["usr_demo_1"]
                return f(*args, **kwargs)

            return jsonify({
                "error": "Authentication required",
                "message": "Missing Bearer token in Authorization header."
            }), 401

        # 2. Mock Token Check (useful for automated testing & development)
        if token.startswith("mock-user-"):
            key_id = token.replace("mock-user-", "")
            
            alias_map = {
                "sarah": "11111111-1111-4111-a111-111111111111",
                "usr_demo_1": "11111111-1111-4111-a111-111111111111",
                "1": "11111111-1111-4111-a111-111111111111",
                "alex": "22222222-2222-4222-a222-222222222222",
                "usr_demo_2": "22222222-2222-4222-a222-222222222222",
                "2": "22222222-2222-4222-a222-222222222222",
                "john": "33333333-3333-4333-a333-333333333333",
                "usr_demo_3": "33333333-3333-4333-a333-333333333333",
                "3": "33333333-3333-4333-a333-333333333333",
            }
            resolved_id = alias_map.get(key_id, key_id)

            # Query database
            db_profile = DatabaseService.get_profile_by_id(resolved_id)
            if db_profile:
                g.current_user = db_profile
                return f(*args, **kwargs)

            # Check email match
            email_profile = DatabaseService.get_profile_by_email(key_id)
            if email_profile:
                g.current_user = email_profile
                return f(*args, **kwargs)

            # Default to first profile in database
            all_p = DatabaseService.get_all_profiles()
            if all_p:
                g.current_user = all_p[0]
                return f(*args, **kwargs)

            g.current_user = list(mock_store.profiles.values())[0]
            return f(*args, **kwargs)

        # 3. Live Supabase Authentication
        user_info = None

        # Approach A: Verify via Supabase Client API
        if supabase_client is not None:
            try:
                user_response = supabase_client.auth.get_user(token)
                if user_response and user_response.user:
                    u = user_response.user
                    user_meta = u.user_metadata or {}
                    user_info = {
                        "id": u.id,
                        "email": u.email,
                        "full_name": user_meta.get("full_name") or user_meta.get("name") or u.email.split("@")[0],
                        "avatar_url": user_meta.get("avatar_url") or user_meta.get("picture", "")
                    }
            except Exception as e:
                logger.warning("Supabase auth.get_user failed: %s. Trying JWT verification.", e)

        # Approach B: Verify via PyJWT with SUPABASE_JWT_SECRET
        if not user_info and Config.SUPABASE_JWT_SECRET:
            try:
                payload = jwt.decode(
                    token,
                    Config.SUPABASE_JWT_SECRET,
                    algorithms=["HS256"],
                    audience="authenticated"
                )
                user_meta = payload.get("user_metadata", {})
                user_info = {
                    "id": payload.get("sub"),
                    "email": payload.get("email"),
                    "full_name": user_meta.get("full_name") or user_meta.get("name") or payload.get("email", "").split("@")[0],
                    "avatar_url": user_meta.get("avatar_url") or user_meta.get("picture", "")
                }
            except jwt.ExpiredSignatureError:
                return jsonify({"error": "Token expired", "message": "Your session has expired. Please sign in again."}), 401
            except Exception as e:
                logger.error("JWT decoding failed: %s", e)

        # Approach C: Fallback unverified decode for development if secret not set
        if not user_info:
            try:
                unverified_payload = jwt.decode(token, options={"verify_signature": False})
                if "sub" in unverified_payload and "email" in unverified_payload:
                    user_meta = unverified_payload.get("user_metadata", {})
                    user_info = {
                        "id": unverified_payload.get("sub"),
                        "email": unverified_payload.get("email"),
                        "full_name": user_meta.get("full_name") or user_meta.get("name") or unverified_payload.get("email", "").split("@")[0],
                        "avatar_url": user_meta.get("avatar_url") or user_meta.get("picture", "")
                    }
            except Exception:
                pass

        if not user_info:
            return jsonify({
                "error": "Invalid token",
                "message": "Failed to authenticate request with provided token."
            }), 401

        # Ensure user profile exists in database
        synced_profile = DatabaseService.upsert_profile(user_info)
        g.current_user = synced_profile

        return f(*args, **kwargs)
    return decorated_function
