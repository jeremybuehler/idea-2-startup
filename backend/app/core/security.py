"""Security utilities for authentication and authorization."""

import secrets
from datetime import datetime, timedelta
from typing import Any, Optional, Union

from fastapi import HTTPException, status
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Token types
TOKEN_TYPE_ACCESS = "access"
TOKEN_TYPE_REFRESH = "refresh"


def create_access_token(
    subject: Union[str, Any], 
    expires_delta: Optional[timedelta] = None,
    token_type: str = TOKEN_TYPE_ACCESS
) -> str:
    """Create a JWT access token.
    
    Args:
        subject: Token subject (usually user ID)
        expires_delta: Token expiration time
        token_type: Type of token (access or refresh)
        
    Returns:
        Encoded JWT token string
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": token_type,
        "iat": datetime.utcnow(),
    }
    
    return jwt.encode(
        to_encode, 
        settings.JWT_SECRET_KEY, 
        algorithm=settings.JWT_ALGORITHM
    )


def create_refresh_token(subject: Union[str, Any]) -> str:
    """Create a JWT refresh token.
    
    Args:
        subject: Token subject (usually user ID)
        
    Returns:
        Encoded JWT refresh token string
    """
    expires_delta = timedelta(days=settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS)
    return create_access_token(
        subject=subject, 
        expires_delta=expires_delta,
        token_type=TOKEN_TYPE_REFRESH
    )


def verify_token(token: str, token_type: str = TOKEN_TYPE_ACCESS) -> Optional[str]:
    """Verify and decode a JWT token.
    
    Args:
        token: JWT token to verify
        token_type: Expected token type
        
    Returns:
        Token subject if valid, None otherwise
        
    Raises:
        HTTPException: If token is invalid or expired
    """
    try:
        payload = jwt.decode(
            token, 
            settings.JWT_SECRET_KEY, 
            algorithms=[settings.JWT_ALGORITHM]
        )
        
        subject: str = payload.get("sub")
        token_type_claim: str = payload.get("type")
        
        if subject is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: no subject",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if token_type_claim != token_type:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Invalid token type: expected {token_type}",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return subject
        
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token validation failed: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash.
    
    Args:
        plain_password: Plain text password
        hashed_password: Hashed password from database
        
    Returns:
        True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt.
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password string
    """
    return pwd_context.hash(password)


def generate_password_reset_token(email: str) -> str:
    """Generate a password reset token.
    
    Args:
        email: User email address
        
    Returns:
        Password reset token
    """
    expires = timedelta(hours=1)  # Reset tokens expire in 1 hour
    return create_access_token(subject=email, expires_delta=expires)


def verify_password_reset_token(token: str) -> Optional[str]:
    """Verify a password reset token.
    
    Args:
        token: Password reset token
        
    Returns:
        Email if token is valid, None otherwise
    """
    try:
        return verify_token(token)
    except HTTPException:
        return None


def generate_api_key() -> str:
    """Generate a secure API key.
    
    Returns:
        Random API key string
    """
    return secrets.token_urlsafe(32)


def create_csrf_token() -> str:
    """Generate CSRF token for forms.
    
    Returns:
        Random CSRF token
    """
    return secrets.token_urlsafe(32)


def validate_csrf_token(token: str, stored_token: str) -> bool:
    """Validate CSRF token.
    
    Args:
        token: Submitted token
        stored_token: Token from session
        
    Returns:
        True if tokens match, False otherwise
    """
    return secrets.compare_digest(token, stored_token)