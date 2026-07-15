import uuid
from datetime import datetime, timezone
from app.extensions import db

class Resume(db.Model):
    """Resume model for storing user resume information."""
    __tablename__ = 'resumes'

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = db.Column(db.UUID(as_uuid=True), db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    title = db.Column(db.String(150), nullable=False)
    description = db.Column(db.String(255), nullable=True)
    
    # Store structured resume data (like personal info, summary, skills) as JSON
    content = db.Column(db.JSON, nullable=True)
    
    created_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    deleted_at = db.Column(db.DateTime(timezone=True), nullable=True)

    # Relationship back to User
    user = db.relationship('User', backref=db.backref('resumes', lazy=True, cascade='all, delete-orphan'))

    def to_dict(self):
        """Serialize resume database model to dictionary for API JSON responses."""
        return {
            "id": str(self.id),
            "userId": str(self.user_id),
            "title": self.title,
            "description": self.description,
            "content": self.content or {},
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None
        }
