import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const TicketList = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');

  const fetchTickets = async (status = '') => {
    try {
      const url = status
        ? `http://localhost:8000/api/tickets?status=${status}`
        : 'http://localhost:8000/api/tickets';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets);
      } else {
        throw new Error('Failed to fetch tickets');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets(statusFilter);
  }, [statusFilter]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container">
      <h2>All Tickets</h2>
      <div className="filter-section">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="status-filter"
        >
          <option value="">All Statuses</option>
          <option value="New">New</option>
          <option value="Assigned">Assigned</option>
          <option value="Processing">Processing</option>
          <option value="Hold">Hold</option>
          <option value="Solved">Solved</option>
        </select>
      </div>
      <div className="ticket-grid">
        {tickets.map((ticket) => (
          <div key={ticket.ticket_id} className="ticket-card">
            <div className="ticket-header">
              <h3>#{ticket.ticket_id} - {ticket.message_subject}</h3>
              <span className={`status-badge status-${ticket.status.toLowerCase()}`}>
                {ticket.status}
              </span>
            </div>
            <p><strong>From:</strong> {ticket.full_name}</p>
            <p><strong>Priority:</strong> {ticket.priority}</p>
            {ticket.assigned_to && (
              <p><strong>Assigned to:</strong> {ticket.assigned_to}</p>
            )}
            <p><strong>Created:</strong> {new Date(ticket.created_at).toLocaleString()}</p>
            {ticket.assigned_at && (
              <p><strong>Assigned at:</strong> {new Date(ticket.assigned_at).toLocaleString()}</p>
            )}
            <div className="ticket-actions">
              <Link to={`/ticket/${ticket.ticket_id}`} className="button">
                View Details
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TicketList; 