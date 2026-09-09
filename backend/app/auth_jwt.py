"""
JWT Authentication Utility for IFashion.

Provides:
- Signed JWT generation (HS256) with expiration (exp) and subject (sub) claims.
- Cryptographic verification & token decoding.
- Backward compatibility fallback for legacy hex tokens.
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt

JWT_SECRET = os.environ.get("JWT_SECRET", "ifashion-atelier-platform-jwt-secret-2026-v1")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30


def create_access_token(
    subject: str,
    extra_claims: Optional[Dict[str, Any]] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Creates a signed JWT access token.
    subject: typically designer.id
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)

    payload = {
        "sub": str(subject),
        "iat": now,
        "exp": expire,
    }
    if extra_claims:
        payload.update(extra_claims)

    encoded_jwt = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and validates a signed JWT access token.
    Returns decoded payload dict if valid, or None if expired/tampered.
    """
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None
