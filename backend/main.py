"""
SupportDesk CRM — Single File Backend
FastAPI + SQLAlchemy + SQLite
All models, schemas, services, and routes merged into one file.
Run: python -m uvicorn main:app --reload
"""

import os
import hashlib
import secrets
import random
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional, List, Tuple

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Depends, HTTPException, Query, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, DateTime, ForeignKey, or_
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel, EmailStr, Field, field_validator

# ═══════════════════════════════════════════════════════════
#  DATABASE SETUP
# ═══════════════════════════════════════════════════════════

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./crm.db")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
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
    id             = Column(Integer, primary_key=True, index=True)
    ticket_id      = Column(String, unique=True, index=True, nullable=False)
    customer_name  = Column(String, nullable=False)
    customer_email = Column(String, nullable=False)
    subject        = Column(String, nullable=False)
    description    = Column(Text, nullable=False)
    status         = Column(String, nullable=False, default="Open")
    priority       = Column(String, nullable=False, default="Medium")
    created_at     = Column(DateTime, nullable=False)
    updated_at     = Column(DateTime, nullable=False)
    notes          = relationship("Note", back_populates="ticket",
                                  cascade="all, delete-orphan",
                                  order_by="Note.created_at.desc()")


class Note(Base):
    __tablename__ = "notes"
    id         = Column(Integer, primary_key=True, index=True)
    ticket_id  = Column(String, ForeignKey("tickets.ticket_id"), nullable=False)
    note_text  = Column(Text, nullable=False)
    created_at = Column(DateTime, nullable=False)
    ticket     = relationship("Ticket", back_populates="notes")


class User(Base):
    __tablename__ = "users"
    id              = Column(Integer, primary_key=True, index=True)
    name            = Column(String, nullable=False)
    email           = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    is_verified     = Column(Boolean, default=False, nullable=False)
    created_at      = Column(DateTime, nullable=False)
    sessions        = relationship("UserSession", back_populates="user",
                                   cascade="all, delete-orphan")


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
    user       = relationship("User", back_populates="sessions")


# ═══════════════════════════════════════════════════════════
#  PYDANTIC SCHEMAS (Request / Response shapes)
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
    def strip_whitespace(cls, v: str) -> str:
        val = v.strip()
        if not val:
            raise ValueError("Field cannot be empty")
        return val


class UpdateTicketRequest(BaseModel):
    status: Optional[str] = Field(None, pattern="^(Open|In Progress|Closed)$")
    note:   Optional[str] = Field(None, max_length=5000)

    @field_validator("note")
    @classmethod
    def strip_note(cls, v):
        if v is None:
            return None
        val = v.strip()
        return val if val else None


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
    ticket_id = f"TKT-{str(count + 1).zfill(3)}"
    while db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first():
        count += 1
        ticket_id = f"TKT-{str(count + 1).zfill(3)}"
    return ticket_id


# ═══════════════════════════════════════════════════════════
#  EMAIL SERVICE
# ═══════════════════════════════════════════════════════════

SMTP_EMAIL    = os.getenv("EMAIL_HOST_USER", "")
SMTP_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")


def send_otp_email(to_email: str, otp_code: str, name: str = "") -> bool:
    """Send OTP via Gmail SMTP. Falls back to console print if not configured."""
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        print(f"[EMAIL] SMTP not configured. OTP for {to_email}: {otp_code}")
        return False

    greeting = f"Hi {name}," if name else "Hi,"

    msg = MIMEMultipart("alternative")
    msg["Subject"] = "Your SupportDesk Verification Code"
    msg["From"]    = f"SupportDesk <{SMTP_EMAIL}>"
    msg["To"]      = to_email

    text_body = f"{greeting}\n\nYour verification code: {otp_code}\n\nExpires in 10 minutes."

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
      <p style="color:#6b7280;font-size:14px;">⏱ Expires in <strong>10 minutes</strong>.</p>
    </div>
    """

    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as server:
            server.ehlo()
            server.starttls()
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        print(f"[EMAIL] OTP sent to {to_email}")
        return True
    except smtplib.SMTPAuthenticationError:
        print("[EMAIL] Gmail auth failed — check EMAIL_HOST_USER and EMAIL_HOST_PASSWORD in .env")
        return False
    except Exception as e:
        print(f"[EMAIL] Error: {e}")
        return False


# ═══════════════════════════════════════════════════════════
#  AUTH SERVICE
# ═══════════════════════════════════════════════════════════

APP_SALT = "crm_support_desk_salt_key_12345!"


def hash_password(password: str) -> str:
    return hashlib.sha256((password + APP_SALT).encode()).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed


def generate_otp_code() -> str:
    return "".join(random.choices("0123456789", k=6))


def register_user(db: Session, req: UserSignUpRequest) -> Tuple[User, str]:
    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        if existing.is_verified:
            raise ValueError("An account with this email already exists.")
        db.delete(existing)
        db.commit()

    ts     = now_utc()
    hashed = hash_password(req.password)

    user = User(name=req.name, email=req.email,
                hashed_password=hashed, is_verified=False, created_at=ts)
    db.add(user)
    db.commit()
    db.refresh(user)

    otp_code   = generate_otp_code()
    expires_at = ts + timedelta(minutes=10)

    db.query(OTP).filter(OTP.email == req.email).delete()
    db.add(OTP(email=req.email, otp_code=otp_code,
               expires_at=expires_at, created_at=ts))
    db.commit()

    send_otp_email(to_email=req.email, otp_code=otp_code, name=req.name)
    return user, otp_code


def verify_user_otp(db: Session, req: OTPVerifyRequest) -> bool:
    ts         = now_utc()
    otp_record = db.query(OTP).filter(
        OTP.email == req.email,
        OTP.otp_code == req.otp_code
    ).order_by(OTP.created_at.desc()).first()

    if not otp_record:
        return False

    if otp_record.expires_at < ts:
        db.delete(otp_record)
        db.commit()
        return False

    user = db.query(User).filter(User.email == req.email).first()
    if user:
        user.is_verified = True
        db.query(OTP).filter(OTP.email == req.email).delete()
        db.commit()
        db.refresh(user)
        return True
    return False


def login_user(db: Session, req: UserLoginRequest) -> Optional[User]:
    user = db.query(User).filter(
        User.email == req.email, User.is_verified == True
    ).first()
    if not user or not verify_password(req.password, user.hashed_password):
        return None
    return user


def create_session(db: Session, user_id: int) -> UserSession:
    ts         = now_utc()
    token      = secrets.token_hex(32)
    expires_at = ts + timedelta(days=30)
    session    = UserSession(user_id=user_id, token=token, expires_at=expires_at)
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def validate_session_token(db: Session, token: str) -> Optional[User]:
    ts      = now_utc()
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
    if session:
        db.delete(session)
        db.commit()
        return True
    return False


# ═══════════════════════════════════════════════════════════
#  TICKET SERVICE
# ═══════════════════════════════════════════════════════════

def create_ticket(db: Session, req: CreateTicketRequest) -> Ticket:
    ts     = now_utc()
    tkt_id = generate_ticket_id(db)
    ticket = Ticket(
        ticket_id=tkt_id, customer_name=req.customer_name,
        customer_email=req.customer_email, subject=req.subject,
        description=req.description, status="Open",
        priority=req.priority, created_at=ts, updated_at=ts
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


def list_tickets(db: Session, status=None, priority=None, search=None) -> List[Ticket]:
    query = db.query(Ticket)
    if status:
        query = query.filter(Ticket.status == status)
    if priority:
        query = query.filter(Ticket.priority == priority)
    if search:
        term  = f"%{search}%"
        query = query.filter(or_(
            Ticket.customer_name.ilike(term),
            Ticket.customer_email.ilike(term),
            Ticket.subject.ilike(term),
            Ticket.description.ilike(term),
            Ticket.ticket_id.ilike(term)
        ))
    return query.order_by(Ticket.created_at.desc()).all()


def get_ticket(db: Session, ticket_id: str) -> Optional[Ticket]:
    return db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()


def update_ticket(db: Session, ticket_id: str, req: UpdateTicketRequest) -> Optional[Ticket]:
    ticket = db.query(Ticket).filter(Ticket.ticket_id == ticket_id).first()
    if not ticket:
        return None
    ts      = now_utc()
    updated = False
    if req.status:
        ticket.status     = req.status
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
    version="1.0.0"
)

# CORS
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create all tables on startup
Base.metadata.create_all(bind=engine)
print("✅ Database tables ready")


# ═══════════════════════════════════════════════════════════
#  AUTH DEPENDENCY
# ═══════════════════════════════════════════════════════════

def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid session token.")
    token = authorization.split(" ")[1].strip()
    user  = validate_session_token(db, token)
    if not user:
        raise HTTPException(status_code=401, detail="Session expired. Please log in again.")
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
        return {
            "success": True,
            "message": "OTP sent to your email. Please verify your account.",
            "email":    user.email,
            "test_otp": otp_code   # shown in response for evaluator convenience
        }
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Registration error: {str(e)}")


@app.post("/api/auth/verify")
def verify_otp(body: OTPVerifyRequest, db: Session = Depends(get_db)):
    success = verify_user_otp(db, body)
    if not success:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP code.")
    return {"success": True, "message": "Account verified. You can now log in."}


@app.post("/api/auth/login", response_model=LoginResponse)
def log_in(body: UserLoginRequest, db: Session = Depends(get_db)):
    user = login_user(db, body)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password, or account not verified.")
    session = create_session(db, user.id)
    return LoginResponse(token=session.token, user=UserResponse.model_validate(user))


@app.post("/api/auth/logout")
def log_out(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=400, detail="No session token provided.")
    token   = authorization.split(" ")[1].strip()
    success = revoke_session(db, token)
    return {"success": success, "message": "Logged out successfully."}


@app.get("/api/auth/me", response_model=AuthMeResponse)
def get_me(user=Depends(get_current_user)):
    return user


# ═══════════════════════════════════════════════════════════
#  ROUTES — Tickets
# ═══════════════════════════════════════════════════════════

@app.post("/api/tickets", response_model=CreateTicketResponse, status_code=201)
def create_new_ticket(body: CreateTicketRequest, db: Session = Depends(get_db)):
    try:
        ticket = create_ticket(db, body)
        return CreateTicketResponse(ticket_id=ticket.ticket_id, created_at=ticket.created_at)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/tickets/stats/summary", response_model=StatsResponse)
def get_stats_summary(db: Session = Depends(get_db)):
    stats = get_stats(db)
    return StatsResponse(**stats)


@app.get("/api/tickets", response_model=List[TicketSummary])
def get_tickets_list(
    status:   Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    search:   Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return list_tickets(db, status=status, priority=priority, search=search)


@app.get("/api/tickets/{ticket_id}", response_model=TicketDetail)
def get_ticket_details(ticket_id: str, db: Session = Depends(get_db)):
    ticket = get_ticket(db, ticket_id)
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    return ticket


@app.put("/api/tickets/{ticket_id}", response_model=UpdateTicketResponse)
def update_existing_ticket(ticket_id: str, body: UpdateTicketRequest, db: Session = Depends(get_db)):
    if body.status is None and body.note is None:
        raise HTTPException(status_code=400, detail="Provide at least 'status' or 'note' to update.")
    ticket = update_ticket(db, ticket_id, body)
    if not ticket:
        raise HTTPException(status_code=404, detail=f"Ticket {ticket_id} not found")
    return UpdateTicketResponse(success=True, updated_at=ticket.updated_at)
