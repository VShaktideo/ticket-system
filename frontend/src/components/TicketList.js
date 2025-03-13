import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import UpdateTicketStatus from './UpdateTicketStatus';

const TicketList = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [activeTicket, setActiveTicket] = useState(null);

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

  const handleStatusUpdate = async () => {
    await fetchTickets(statusFilter);
    setActiveTicket(null);
  };

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
      <div className="table-container">
        <table className="ticket-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Subject</th>
              <th>Description</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Assigned To</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket.ticket_id}>
                <td>#{ticket.ticket_id}</td>
                <td>{ticket.message_subject}</td>
                <td className="description-cell">
                  {ticket.description && (
                    ticket.description.length > 100 
                      ? `${ticket.description.substring(0, 100)}...` 
                      : ticket.description
                  )}
                </td>
                <td>
                  <span className={`priority-badge priority-${ticket.priority.toLowerCase()}`}>
                    {ticket.priority}
                  </span>
                </td>
                <td>
                  <span className={`status-badge status-${ticket.status.toLowerCase()}`}>
                    {ticket.status}
                  </span>
                </td>
                <td>{ticket.assigned_to || '-'}</td>
                <td className="action-cell">
                  <Link to={`/ticket/${ticket.ticket_id}`} className="button button-small">
                    View
                  </Link>
                  <button 
                    className="button button-small"
                    onClick={() => setActiveTicket(activeTicket === ticket.ticket_id ? null : ticket.ticket_id)}
                  >
                    Update
                  </button>
                  {activeTicket === ticket.ticket_id && (
                    <div className="update-status-popup">
                      <UpdateTicketStatus
                        ticketId={ticket.ticket_id}
                        currentStatus={ticket.status}
                        onStatusUpdate={handleStatusUpdate}
                      />
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TicketList; 