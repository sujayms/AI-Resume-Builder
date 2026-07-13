import uuid
from datetime import datetime, timezone
from app.extensions import db

class User(db.Model):
    """User identity model."""
    __tablename__ = 'users'

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    is_active = db.Column(db.Boolean, nullable=False, default=True)
    email_verified = db.Column(db.Boolean, nullable=False, default=False)
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    deleted_at = db.Column(db.DateTime(timezone=True), nullable=True)

    # Relationships
    refresh_tokens = db.relationship('RefreshToken', back_populates='user', cascade='all, delete-orphan')

    def to_dict(self):
        """Serialize user data for responses."""
        return {
            "id": str(self.id),
            "name": self.name,
            "email": self.email,
            "emailVerified": self.email_verified,
            "createdAt": self.created_at.isoformat() if self.created_at else None
        }


class RefreshToken(db.Model):
    """Model to store hashed user session refresh tokens for revocation."""
    __tablename__ = 'refresh_tokens'

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    token_hash = db.Column(db.String(255), nullable=False, unique=True, index=True)
    device_info = db.Column(db.String(255), nullable=True)
    issued_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    expires_at = db.Column(db.DateTime(timezone=True), nullable=False)
    revoked_at = db.Column(db.DateTime(timezone=True), nullable=True)

    # Relationships
    user = db.relationship('User', back_populates='refresh_tokens')

    def is_expired(self):
        """Check if the refresh token is expired."""
        return datetime.now(timezone.utc) > self.expires_at.replace(tzinfo=timezone.utc)

    def is_valid(self):
        """Check if the refresh token is valid (not expired and not revoked)."""
        return not self.is_expired() and self.revoked_at is None
