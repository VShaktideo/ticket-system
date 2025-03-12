import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import UpdateTicketStatus from './UpdateTicketStatus';

const TicketDetails = () => {
  const { ticketId } = useParams();
  const [ticket, setTicket] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTicketDetails = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/tickets/${ticketId}`);
      if (response.ok) {
        const data = await response.json();
        setTicket(data);
      } else {
        throw new Error('Failed to fetch ticket details');
      }
    } catch (error) {
      setError('Error fetching ticket details: ' + error.message);
    }
  };

  const fetchTicketHistory = async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/tickets/${ticketId}/history`);
      if (response.ok) {
        const data = await response.json();
        setHistory(data.history);
      } else {
        throw new Error('Failed to fetch ticket history');
      }
    } catch (error) {
      setError('Error fetching ticket history: ' + error.message);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTicketDetails(), fetchTicketHistory()]);
      setLoading(false);
    };

    loadData();
  }, [ticketId]);

  const handleStatusUpdate = async () => {
    await Promise.all([fetchTicketDetails(), fetchTicketHistory()]);
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!ticket) return <div>Ticket not found</div>;

  return (
    <div className="container">
      <div className="ticket-card">
        <h2>Ticket #{ticket.ticket_id}</h2>
        <div className="ticket-info">
          <div className="ticket-status-section">
            <p>
              <strong>Status:</strong> 
              <span className={`status-badge status-${ticket.status.toLowerCase()}`}>
                {ticket.status}
              </span>
            </p>
            <p><strong>Priority:</strong> {ticket.priority}</p>
          </div>

          <div className="ticket-assignment-section">
            {ticket.assigned_to && (
              <p><strong>Assigned to:</strong> {ticket.assigned_to}</p>
            )}
            <p><strong>Created:</strong> {new Date(ticket.created_at).toLocaleString()}</p>
            {ticket.assigned_at && (
              <p><strong>Assigned at:</strong> {new Date(ticket.assigned_at).toLocaleString()}</p>
            )}
          </div>

          <div className="ticket-details-section">
            <p><strong>Subject:</strong> {ticket.message_subject}</p>
            <p><strong>Submitted by:</strong> {ticket.full_name}</p>
            <p><strong>Email:</strong> {ticket.email}</p>
            {ticket.phone_number && <p><strong>Phone:</strong> {ticket.phone_number}</p>}
            {ticket.company_name && <p><strong>Company:</strong> {ticket.company_name}</p>}
            <p><strong>Description:</strong></p>
            <p className="ticket-description">{ticket.description}</p>
          </div>
        </div>

        <UpdateTicketStatus
          ticketId={ticket.ticket_id}
          currentStatus={ticket.status}
          onStatusUpdate={handleStatusUpdate}
        />

        <h3>Ticket History</h3>
        <div className="ticket-history">
          {history.map((entry, index) => (
            <div key={index} className="history-entry">
              <p>
                <strong>{new Date(entry.changed_at).toLocaleString()}</strong>
                <br />
                Status changed from {entry.old_status} to {entry.new_status}
                <br />
                By: {entry.changed_by}
                {entry.assigned_to && <><br />Assigned to: {entry.assigned_to}</>}
                {entry.comment && <><br />Comment: {entry.comment}</>}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TicketDetails; 