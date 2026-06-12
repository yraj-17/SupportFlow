"""
SupportDesk CRM API
A FastAPI-based customer support ticketing system with JWT-less session auth
and email OTP verification.
"""

import os
import hashlib
import secrets
import random
import smtplib
import logging
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List, Tuple

from dotenv import load_dotenv
from fastapi import FastAPI, Depends, HTTPException, Query, Header, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import (
    create_engine, Column, Integer, String, Text, Boolean,
    DateTime, ForeignKey, or_
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel, EmailStr, Field, field_validator

load_dotenv()

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO"),
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("supportdesk")


# ═══════════════════════════════════════════════════════════
#  CONFIG
# ═══════════════════════════════════════════════════════════

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./crm.db")
    ALLOWED_ORIGINS: List[str] = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

    SMTP_HOST: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_EMAIL: str = os.getenv("EMAIL_HOST_USER", "")
    SMTP_PASSWORD: str = os.getenv("EMAIL_HOST_PASSWORD", "")

    # Used for password hashing. MUST be overridden via env var in production.
    PASSWORD_SALT: str = os.getenv("PASSWORD_SALT", "crm_support_desk_salt_key_12345!")

    OTP_LENGTH: int = 6
    OTP_EXPIRY_MINUTES: int = 10
    SESSION_EXPIRY_DAYS: int = 30

    # When True, returns the OTP in the signup response (useful for local/dev testing).
    EXPOSE_OTP_IN_RESPONSE: bool = os.getenv("EXPOSE_OTP_IN_RESPONSE", "true").lower() == "true"


settings = Settings()


# ═══════════════════════════════════════════════════════════
#  DATABASE SETUP
# ═══════════════════════════════════════════════════════════

connect_args = {"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(settings.DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ═══════════════════════════════════════════════════════════
#  MODELS (SQLAlchemy ORM Tables)
# ═══════════════════════════════════════════════════════════

class Ticket(Base):
    __tablename__ = "tickets"

    id              = Column(Integer, primary_key=True, index=True)
    ticket_id       = Column(String, unique=True, index=True, nullable=False)
    customer_name   = Column(String, nullable=False)
    customer_email  = Column(String, nullable=False)
    subject         = Column(String, nullable=False)
    description     = Column(Text, nullable=False)
    status          = Column(String, nullable=False, default="Open")
    priority        = Column(String, nullable=False, default="Medium")
    created_at      = Column(DateTime, nullable=False)
    updated_at      = Column(DateTime, nullable=False)

    notes = relationship(
        "Note",
        back_populates="ticket",
        cascade="all, delete-orphan",
        order_by="Note.created_at.desc()",
    )


class Note(Base):
    __tablename__ = "notes"

    id         = Column(Integer, primary_key=True, index=True)
    ticket_id  = Column(String, ForeignKey("tickets.ticket_id"), nullable=False)
    note_text  = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False)

    ticket = relationship("Ticket", back_populates="notes")


class User(Base):
    __tablename__ = "users"

    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String, nullable=False)
    email           = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_verified     = Column(Boolean, default=False, nullable=False)
    created_at      = Column(DateTime, nullable=False)

    sessions = relationship(
        "UserSession",
        back_populates="user",
        cascade="all, delete-orphan",
    )


class OTP(Base):
    __tablename__ = "otps"

    id         = Column(Integer, primary_key=True, index=True)
    email      = Column(String, index=True, nullable=False)
    otp_code   = Column(String, nullable=False)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, nullable=False)


class UserSession(Base):
    __tablename__ = "user_sessions"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id"), nullable=False)
    token      = Column(String, unique=True, index=True, nullable=False)
    expires_at = Column(DateTime, nullable=False)

    user = relationship("User", back_populates="sessions")


# ═══════════════════════════════════════════════════════════
#  PYDANTIC SCHEMAS
# ═══════════════════════════════════════════════════════════

# ── Ticket Schemas ──────────────────────────────────────────

class CreateTicketRequest(BaseModel):
    customer_name:  str = Field(..., min_length=1, max_length=100)
    customer_email: EmailStr
    subject:        str = Field(..., min_length=1, max_length=200)
    description:    str = Field(..., min_length=1, max_length=5000)
    priority:       Optional[str] = Field("Medium", pattern="^(Low|Medium|High)$")

    @field_validator("customer_name", "subject", "description")
    @classmethod
    def not_blank(cls, v: str) -> str:
        val = v.strip()
        if not val:
            raise ValueError("Field cannot be empty")
        return val


class UpdateTicketRequest(BaseModel):
    status: Optional[str] = Field(None, pattern="^(Open|In Progress|Closed)$")
    note:   Optional[str] = Field(None, max_length=5000)

    @field_validator("note")
    @classmethod
    def normalize_note(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        val = v.strip()
        return val or None


class NoteResponse(BaseModel):
    id:         int
    ticket_id:  str
    note_text:  str
    created_at: datetime

    class Config:
        from_attributes = True


class TicketSummary(BaseModel):
    ticket_id:      str
    customer_name:  str
    customer_email: str
    subject:        str
    status:         str
    priority:       str
    created_at:     datetime
    updated_at:     datetime

    class Config:
        from_attributes = True


class TicketDetail(BaseModel):
    ticket_id:      str
    customer_name:  str
    customer_email: str
    subject:        str
    description:    str
    status:         str
    priority:       str
    created_at:     datetime
    updated_at:     datetime
    notes:          List[NoteResponse] = []

    class Config:
        from_attributes = True


class CreateTicketResponse(BaseModel):
    ticket_id:  str
    created_at: datetime


class UpdateTicketResponse(BaseModel):
    success:    bool
    updated_at: datetime


class StatsResponse(BaseModel):
    total:       int
    open:        int
    in_progress: int
    closed:      int


# ── Auth Schemas ────────────────────────────────────────────

class UserSignUpRequest(BaseModel):
    name:     str = Field(..., min_length=2, max_length=100)
    email:    EmailStr
    password: str = Field(..., min_length=6, max_length=50)


class UserLoginRequest(BaseModel):
    email:    EmailStr
    password: str


class OTPVerifyRequest(BaseModel):
    email:    EmailStr
    otp_code: str = Field(..., min_length=6, max_length=6)


class UserResponse(BaseModel):
    id:          int
    name:        str
    email:       str
    is_verified: bool
    created_at:  datetime

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    token: str
    user:  UserResponse


class AuthMeResponse(BaseModel):
    id:          int
    name:        str
    email:       str
    is_verified: bool

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════════════════
#  HELPERS
# ═══════════════════════════════════════════════════════════

def now_utc() -> datetime:
    """Naive UTC datetime — matches SQLite storage format."""
    return datetime.utcnow()


def generate_ticket_id(db: Session) -> str:
    """Generates TKT-001 style IDs, collision-safe."""
    count = db.query(Ticket).count()
    ticket_id = f"TKT-{count + 1:03d}"
    while db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first():
        count += 1
        ticket_id = f"TKT-{count + 1:03d}"
    return ticket_id


# ═══════════════════════════════════════════════════════════
#  EMAIL SERVICE
# ═══════════════════════════════════════════════════════════

def _build_otp_email(to_email: str, otp_code: str, name: str = "") -> MIMEMultipart:
    greeting = f"Hi {name}," if name else "Hi,"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your SupportDesk Verification Code"
    msg["From"] = f"SupportDesk <{settings.SMTP_EMAIL}>"
    msg["To"] = to_email

    text_body = (
        f"{greeting}\n\n"
        f"Your verification code: {otp_code}\n\n"
        f"Expires in {settings.OTP_EXPIRY_MINUTES} minutes."
    )

    html_body = f"""
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:40px auto;
                background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:40px;">
      <h2 style="color:#111827;margin-top:0;">SupportDesk</h2>
      <p style="color:#374151;">{greeting}</p>
      <p style="color:#374151;">Your verification code is:</p>
      <div style="background:#f0f4ff;border:2px dashed #4f6ef7;border-radius:10px;
                  text-align:center;padding:24px;margin:24px 0;">
        <span style="font-size:36px;font-weight:bold;letter-spacing:10px;
                     color:#3b55e6;font-family:monospace;">{otp_code}</span>
      </div>
      <p style="color:#6b7280;font-size:14px;">
        ⏱ Expires in <strong>{settings.OTP_EXPIRY_MINUTES} minutes</strong>.
      </p>
    </div>
    """

    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))
    return msg


def send_otp_email(to_email: str, otp_code: str, name: str = "") -> bool:
    """Send OTP via SMTP. Falls back to logging if SMTP isn't configured."""
    if not settings.SMTP_EMAIL or not settings.SMTP_PASSWORD:
        logger.warning("SMTP not configured. OTP for %s: %s", to_email, otp_code)
        return False

    msg = _build_otp_email(to_email, otp_code, name)

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_EMAIL, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_EMAIL, to_email, msg.as_string())
        logger.info("OTP email sent to %s", to_email)
        return True
    except smtplib.SMTPAuthenticationError:
        logger.error("SMTP auth failed — check EMAIL_HOST_USER / EMAIL_HOST_PASSWORD")
        return False
    except Exception:
        logger.exception("Failed to send OTP email to %s", to_email)
        return False


# ═══════════════════════════════════════════════════════════
#  AUTH SERVICE
# ═══════════════════════════════════════════════════════════

def hash_password(password: str) -> str:
    return hashlib.sha256((password + settings.PASSWORD_SALT).encode()).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    return secrets.compare_digest(hash_password(password), hashed)


def generate_otp_code() -> str:
    return "".join(random.choices("0123456789", k=settings.OTP_LENGTH))


def register_user(db: Session, req: UserSignUpRequest) -> Tuple[User, str]:
    """
    Create (or replace an unverified) user and issue a fresh OTP.
    Raises ValueError if a verified account already exists for this email.
    """
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        if existing.is_verified:
            raise ValueError("An account with this email already exists.")
        # Unverified leftover signup — replace it.
        db.delete(existing)
        db.commit()

    ts = now_utc()
    user = User(
        name=req.name,
        email=req.email,
        hashed_password=hash_password(req.password),
        is_verified=False,
        created_at=ts,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    otp_code = generate_otp_code()
    expires_at = ts + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)

    db.query(OTP).filter(OTP.email == req.email).delete()
    db.add(OTP(email=req.email, otp_code=otp_code, expires_at=expires_at, created_at=ts))
    db.commit()

    send_otp_email(to_email=req.email, otp_code=otp_code, name=req.name)
    return user, otp_code


def verify_user_otp(db: Session, req: OTPVerifyRequest) -> bool:
    ts = now_utc()
    otp_record = (
        db.query(OTP)
        .filter(OTP.email == req.email, OTP.otp_code == req.otp_code)
        .order_by(OTP.created_at.desc())
        .first()
    )

    if not otp_record:
        return False

    if otp_record.expires_at < ts:
        db.delete(otp_record)
        db.commit()
        return False

    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        return False

    user.is_verified = True
    db.query(OTP).filter(OTP.email == req.email).delete()
    db.commit()
    db.refresh(user)
    return True


def login_user(db: Session, req: UserLoginRequest) -> Optional[User]:
    user = (
        db.query(User)
        .filter(User.email == req.email, User.is_verified == True)  # noqa: E712
        .first()
    )
    if not user or not verify_password(req.password, user.hashed_password):
        return None
    return user


def create_session(db: Session, user_id: int) -> UserSession:
    ts = now_utc()
    session = UserSession(
        user_id=user_id,
        token=secrets.token_hex(32),
        expires_at=ts + timedelta(days=settings.SESSION_EXPIRY_DAYS),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def validate_session_token(db: Session, token: str) -> Optional[User]:
    ts = now_utc()
    session = db.query(UserSession).filter(UserSession.token == token).first()
    if not session:
        return None
    if session.expires_at < ts:
        db.delete(session)
        db.commit()
        return None
    return session.user


def revoke_session(db: Session, token: str) -> bool:
    session = db.query(UserSession).filter(UserSession.token == token).first()
    if not session:
        return False
    db.delete(session)
    db.commit()
    return True


# ═══════════════════════════════════════════════════════════
#  TICKET SERVICE
# ═══════════════════════════════════════════════════════════

def create_ticket(db: Session, req: CreateTicketRequest) -> Ticket:
    ts = now_utc()
    ticket = Ticket(
        ticket_id=generate_ticket_id(db),
        customer_name=req.customer_name,
        customer_email=req.customer_email,
        subject=req.subject,
        description=req.description,
        status="Open",
        priority=req.priority,
        created_at=ts,
        updated_at=ts,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


def list_tickets(
    db: Session,
    status: Optional[str] = None,
    priority: Optional[str] = None,
    search: Optional[str] = None,
) -> List[Ticket]:
    query = db.query(Ticket)

    if status:
        query = query.filter(Ticket.status == status)
    if priority:
        query = query.filter(Ticket.priority == priority)
    if search:
        term = f"%{search}%"
        query = query.filter(
            or_(
                Ticket.customer_name.ilike(term),
                Ticket.customer_email.ilike(term),
                Ticket.subject.ilike(term),
                Ticket.description.ilike(term),
                Ticket.ticket_id.ilike(term),
            )
        )

    return query.order_by(Ticket.created_at.desc()).all()


def get_ticket(db: Session, ticket_id: str) -> Optional[Ticket]:
    return db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()


def update_ticket(db: Session, ticket_id: str, req: UpdateTicketRequest) -> Optional[Ticket]:
    ticket = get_ticket(db, ticket_id)
    if not ticket:
        return None

    ts = now_utc()
    updated = False

    if req.status:
        ticket.status = req.status
        ticket.updated_at = ts
        updated = True

    if req.note:
        db.add(Note(ticket_id=ticket_id, note_text=req.note, created_at=ts))
        ticket.updated_at = ts
        updated = True

    if updated:
        db.commit()
        db.refresh(ticket)

    return ticket


def get_stats(db: Session) -> dict:
    return {
        "total":       db.query(Ticket).count(),
        "open":        db.query(Ticket).filter(Ticket.status == "Open").count(),
        "in_progress": db.query(Ticket).filter(Ticket.status == "In Progress").count(),
        "closed":      db.query(Ticket).filter(Ticket.status == "Closed").count(),
    }


# ═══════════════════════════════════════════════════════════
#  FASTAPI APP
# ═══════════════════════════════════════════════════════════

app = FastAPI(
    title="SupportDesk CRM API",
    description="Customer support ticketing system",
    version="1.0.0",
)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create tables immediately at import time
Base.metadata.create_all(bind=engine)
logger.info("Database tables ready")


# ═══════════════════════════════════════════════════════════
#  AUTH DEPENDENCY
# ═══════════════════════════════════════════════════════════

def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid session token.",
        )

    token = authorization.removeprefix("Bearer ").strip()
    user = validate_session_token(db, token)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired. Please log in again.",
        )
    return user


# ═══════════════════════════════════════════════════════════
#  ROUTES — Health
# ═══════════════════════════════════════════════════════════

@app.get("/")
def root():
    return {"status": "ok", "message": "SupportDesk CRM API is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


# ═══════════════════════════════════════════════════════════
#  ROUTES — Auth
# ═══════════════════════════════════════════════════════════

@app.post("/api/auth/signup")
def sign_up(body: UserSignUpRequest, db: Session = Depends(get_db)):
    try:
        user, otp_code = register_user(db, body)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.exception("Signup failed for %s", body.email)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration error: {e}",
        )

    response = {
        "success": True,
        "message": "OTP sent to your email. Please verify your account.",
        "email": user.email,
    }
    # Only included when explicitly enabled (e.g. local/dev/testing environments).
    if settings.EXPOSE_OTP_IN_RESPONSE:
        response["test_otp"] = otp_code

    return response


@app.post("/api/auth/verify")
def verify_otp(body: OTPVerifyRequest, db: Session = Depends(get_db)):
    if not verify_user_otp(db, body):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired OTP code.",
        )
    return {"success": True, "message": "Account verified. You can now log in."}


@app.post("/api/auth/login", response_model=LoginResponse)
def log_in(body: UserLoginRequest, db: Session = Depends(get_db)):
    user = login_user(db, body)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect email or password, or account not verified.",
        )
    session = create_session(db, user.id)
    return LoginResponse(token=session.token, user=UserResponse.model_validate(user))


@app.post("/api/auth/logout")
def log_out(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No session token provided.",
        )
    token = authorization.removeprefix("Bearer ").strip()
    success = revoke_session(db, token)
    return {"success": success, "message": "Logged out successfully."}


@app.get("/api/auth/me", response_model=AuthMeResponse)
def get_me(user: User = Depends(get_current_user)):
    return user


# ═══════════════════════════════════════════════════════════
#  ROUTES — Tickets
# ═══════════════════════════════════════════════════════════

@app.post("/api/tickets", response_model=CreateTicketResponse, status_code=status.HTTP_201_CREATED)
def create_new_ticket(body: CreateTicketRequest, db: Session = Depends(get_db)):
    try:
        ticket = create_ticket(db, body)
    except Exception as e:
        logger.exception("Failed to create ticket")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))
    return CreateTicketResponse(ticket_id=ticket.ticket_id, created_at=ticket.created_at)


@app.get("/api/tickets/stats/summary", response_model=StatsResponse)
def get_stats_summary(db: Session = Depends(get_db)):
    return StatsResponse(**get_stats(db))


@app.get("/api/tickets", response_model=List[TicketSummary])
def get_tickets_list(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    return list_tickets(db, status=status, priority=priority, search=search)


@app.get("/api/tickets/{ticket_id}", response_model=TicketDetail)
def get_ticket_details(ticket_id: str, db: Session = Depends(get_db)):
    ticket = get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ticket {ticket_id} not found")
    return ticket


@app.put("/api/tickets/{ticket_id}", response_model=UpdateTicketResponse)
def update_existing_ticket(ticket_id: str, body: UpdateTicketRequest, db: Session = Depends(get_db)):
    if body.status is None and body.note is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide at least 'status' or 'note' to update.",
        )
    ticket = update_ticket(db, ticket_id, body)
    if not ticket:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ticket {ticket_id} not found")
    return UpdateTicketResponse(success=True, updated_at=ticket.updated_at)
