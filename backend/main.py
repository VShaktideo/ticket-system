from fastapi import FastAPI, HTTPException, Path, Depends, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr
import sqlite3
import os
from dotenv import load_dotenv
from datetime import datetime
from contextlib import contextmanager
from typing import Generator, Optional, List

# Load environment variables
load_dotenv()

# Initialize FastAPI
app = FastAPI(
    title="Ticket System API",
    description="API for managing support tickets",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Error Handling Middleware
@app.middleware("http")
async def error_handling_middleware(request, call_next):
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})

# Request Logging Middleware
@app.middleware("http")
async def log_requests(request, call_next):
    print(f"Incoming request: {request.method} {request.url}")
    response = await call_next(request)
    print(f"Response status: {response.status_code}")
    return response

# Database Connection
@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    conn = sqlite3.connect("tickets.db", timeout=30.0,check_same_thread=False)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# Initialize Database Tables on Startup
@app.on_event("startup")
async def startup_event():
    with get_db() as conn:
        cursor = conn.cursor()

        # Enable Write-Ahead Logging (WAL) to reduce locking issues
        cursor.execute("PRAGMA journal_mode=WAL;")

        # Increase busy timeout to wait for database unlock
        cursor.execute("PRAGMA busy_timeout = 5000;")  # 5 seconds

        # Create tables if they don't exist
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tickets (
                ticket_id INTEGER PRIMARY KEY AUTOINCREMENT,
                full_name TEXT NOT NULL,
                phone_number TEXT,
                email TEXT NOT NULL,
                company_name TEXT,
                message_subject TEXT NOT NULL,
                description TEXT NOT NULL,
                assigned_to TEXT,
                status TEXT CHECK(status IN ('New', 'Assigned', 'Processing', 'Hold', 'Solved')) DEFAULT 'New',
                priority TEXT CHECK(priority IN ('Low', 'Medium', 'High', 'Urgent')) DEFAULT 'Medium',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                assigned_at TIMESTAMP
            )
        """)
        
        # Add assigned_at column if it doesn't exist (for existing tables)
        try:
            cursor.execute("ALTER TABLE tickets ADD COLUMN assigned_at TIMESTAMP;")
        except sqlite3.OperationalError:
            # Column already exists
            pass
            
        conn.commit()
        print("Database initialized successfully")


# Root API
@app.get("/")
async def root():
    return {"message": "Ticket System API is running", "version": "1.0.0"}

# ✅ API to Create a Ticket
class TicketCreate(BaseModel):
    full_name: str
    phone_number: Optional[str] = None
    email: str
    company_name: Optional[str] = None
    message_subject: str
    description: str
    priority: str = "Medium"

@app.post("/api/tickets")
async def create_ticket(ticket: TicketCreate):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO tickets (full_name, phone_number, email, company_name, message_subject, description, priority)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                ticket.full_name, ticket.phone_number, ticket.email, ticket.company_name,
                ticket.message_subject, ticket.description, ticket.priority
            ))
            ticket_id = cursor.lastrowid
            conn.commit()
            return {"message": "Ticket created successfully", "ticket_id": ticket_id}
    except sqlite3.OperationalError as e:
        if "database is locked" in str(e):
            raise HTTPException(status_code=503, detail="Database is busy, please try again")
        else:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# API to Update Ticket Status (Logs Status Changes)
@app.put("/api/tickets/{ticket_id}/status")
async def update_ticket_status(
    ticket_id: int,
    new_status: str,
    changed_by: str,
    assigned_to: Optional[str] = None,
    comment: Optional[str] = None
):
    """Update the status of a ticket and log the change in history"""
    valid_statuses = {"New", "Assigned", "Processing", "Hold", "Solved"}

    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid status provided")

    # If status is "Assigned", assigned_to must be provided
    if new_status == "Assigned" and not assigned_to:
        raise HTTPException(status_code=400, detail="Assigned_to field is required when status is Assigned")

    with get_db() as conn:
        cursor = conn.cursor()

        # Get Current Status
        cursor.execute("SELECT status FROM tickets WHERE ticket_id = ?", (ticket_id,))
        result = cursor.fetchone()

        if not result:
            raise HTTPException(status_code=404, detail="Ticket not found")

        old_status = result["status"]

        if old_status == new_status:
            return {"message": "Status is already set to the requested value"}

        # Update Ticket Status and assigned_at if status is changing to 'Assigned'
        if new_status == 'Assigned':
            cursor.execute("""
                UPDATE tickets 
                SET status = ?, 
                    assigned_at = CURRENT_TIMESTAMP,
                    assigned_to = ?
                WHERE ticket_id = ?
            """, (new_status, assigned_to, ticket_id))
        else:
            cursor.execute("""
                UPDATE tickets 
                SET status = ?,
                    assigned_to = ?
                WHERE ticket_id = ?
            """, (new_status, assigned_to, ticket_id))

        # Log Status Change in History
        cursor.execute("""
            INSERT INTO status_history (
                ticket_id, old_status, new_status, 
                changed_by, assigned_to, comment
            )
            VALUES (?, ?, ?, ?, ?, ?)
        """, (ticket_id, old_status, new_status, changed_by, assigned_to, comment))

        conn.commit()
        return {
            "message": "Ticket status updated successfully", 
            "ticket_id": ticket_id, 
            "new_status": new_status,
            "assigned_to": assigned_to
        }

# ✅ API to Get Ticket History
@app.get("/api/tickets/{ticket_id}/history")
async def get_ticket_history(ticket_id: int = Path(..., title="Ticket ID", gt=0)):
    """Fetch ticket status change history"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT old_status, new_status, changed_by, comment, changed_at
            FROM status_history WHERE ticket_id = ?
        """, (ticket_id,))
        history = cursor.fetchall()

        if not history:
            return {"ticket_id": ticket_id, "history": []}  # Return empty array instead of "Not Found"

        history_list = [
            {
                "old_status": row["old_status"],
                "new_status": row["new_status"],
                "changed_by": row["changed_by"],
                "comment": row["comment"],
                "changed_at": row["changed_at"],
            }
            for row in history
        ]

        return {"ticket_id": ticket_id, "history": history_list}

@app.get("/api/tickets/{ticket_id}")
async def get_ticket_details(ticket_id: int = Path(..., title="Ticket ID", gt=0)):
    """Fetch details of a specific ticket"""
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT 
                ticket_id,
                full_name,
                phone_number,
                email,
                company_name,
                message_subject,
                description,
                assigned_to,
                status,
                priority,
                created_at,
                assigned_at
            FROM tickets 
            WHERE ticket_id = ?
        """, (ticket_id,))
        
        ticket = cursor.fetchone()
        
        if not ticket:
            raise HTTPException(
                status_code=404, 
                detail=f"Ticket with ID {ticket_id} not found"
            )
            
        ticket_dict = dict(ticket)
        return ticket_dict

# Add this new endpoint
@app.get("/api/tickets")
async def get_all_tickets(status: Optional[str] = Query(None)):
    """Fetch all tickets with optional status filter"""
    with get_db() as conn:
        cursor = conn.cursor()
        
        if status:
            cursor.execute("""
                SELECT 
                    ticket_id, full_name, email, message_subject,
                    description, status, priority, created_at, 
                    assigned_at, assigned_to
                FROM tickets 
                WHERE status = ?
                ORDER BY created_at DESC
            """, (status,))
        else:
            cursor.execute("""
                SELECT 
                    ticket_id, full_name, email, message_subject,
                    description, status, priority, created_at, 
                    assigned_at, assigned_to
                FROM tickets
                ORDER BY created_at DESC
            """)
        
        tickets = cursor.fetchall()
        return {"tickets": [dict(ticket) for ticket in tickets]}

        


