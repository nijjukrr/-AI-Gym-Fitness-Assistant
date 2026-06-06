import os
import time
import base64
import hashlib
import json
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Dict, Any, Optional
from backend.database import find_documents, insert_document

# Safe imports for standard security packages
try:
    import jwt
    HAS_JWT = True
except ImportError:
    HAS_JWT = False

try:
    from passlib.context import CryptContext
    HAS_PASSLIB = True
except ImportError:
    HAS_PASSLIB = False

JWT_SECRET = os.getenv("JWT_SECRET", "trivans_super_secret_fitness_key_2026")
JWT_ALGORITHM = "HS256"

security = HTTPBearer()

# Password Context Setup
if HAS_PASSLIB:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
else:
    pwd_context = None

def hash_password(password: str) -> str:
    if pwd_context:
        return pwd_context.hash(password)
    # Fallback to simple SHA-256 with salt
    salt = "trivan_salt"
    hashed = hashlib.sha256((password + salt).encode()).hexdigest()
    return f"sha256${hashed}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    if pwd_context:
        try:
            return pwd_context.verify(plain_password, hashed_password)
        except Exception:
            pass
    # Fallback/Fallback matching
    if hashed_password.startswith("sha256$"):
        salt = "trivan_salt"
        hashed = hashlib.sha256((plain_password + salt).encode()).hexdigest()
        return f"sha256${hashed}" == hashed_password
    # Plain check if hashing fails completely
    return plain_password == hashed_password

# JWT Token Functions
def create_access_token(data: dict, expires_delta: float = 3600 * 24) -> str:
    payload = data.copy()
    payload["exp"] = time.time() + expires_delta
    
    if HAS_JWT:
        return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    # Custom fallback token signature (Base64 URL header.payload.signature)
    header = {"alg": "HS256", "typ": "JWT"}
    header_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    payload_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")
    # Simple HMAC replacement signature
    sig = hashlib.sha256(f"{header_b64}.{payload_b64}.{JWT_SECRET}".encode()).hexdigest()
    return f"{header_b64}.{payload_b64}.{sig}"

def decode_access_token(token: str) -> Optional[dict]:
    if HAS_JWT:
        try:
            return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        except Exception:
            return None
            
    # Fallback validation
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        header_b64, payload_b64, sig = parts
        # Recreate signature
        recreated_sig = hashlib.sha256(f"{header_b64}.{payload_b64}.{JWT_SECRET}".encode()).hexdigest()
        if recreated_sig != sig:
            return None
            
        # Decode payload (add padding if necessary)
        rem = len(payload_b64) % 4
        if rem > 0:
            payload_b64 += "=" * (4 - rem)
        payload = json.loads(base64.urlsafe_b64decode(payload_b64.encode()).decode())
        if payload.get("exp", 0) < time.time():
            return None  # Expired
        return payload
    except Exception:
        return None

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    email = payload.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing email claim",
        )
    # Fetch from database
    users = find_documents("users", {"email": email})
    if not users:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return users[0]
