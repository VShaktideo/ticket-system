import React, { useState } from 'react';
import { updateTicketStatus } from '../services/api';

const UpdateTicketStatus = ({ ticketId, currentStatus, onStatusUpdate }) => {
  const [newStatus, setNewStatus] = useState(currentStatus);
  const [comment, setComment] = useState('');
  const [changedBy, setChangedBy] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await updateTicketStatus(ticketId, newStatus, changedBy, assignedTo, comment);
      onStatusUpdate();
      setComment('');
      setAssignedTo('');
      alert('Status updated successfully!');
    } catch (error) {
      setError('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="update-status-form">
      <h3>Update Status</h3>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="newStatus">New Status</label>
          <select
            id="newStatus"
            value={newStatus}
            onChange={(e) => setNewStatus(e.target.value)}
            required
          >
            <option value="New">New</option>
            <option value="Assigned">Assigned</option>
            <option value="Processing">Processing</option>
            <option value="Hold">Hold</option>
            <option value="Solved">Solved</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="assignedTo">
            Assign To {newStatus === 'Assigned' && <span className="required">*</span>}
          </label>
          <input
            type="text"
            id="assignedTo"
            value={assignedTo}
            onChange={(e) => setAssignedTo(e.target.value)}
            required={newStatus === 'Assigned'}
            placeholder="Enter assignee name"
          />
        </div>

        <div className="form-group">
          <label htmlFor="changedBy">Changed By</label>
          <input
            type="text"
            id="changedBy"
            value={changedBy}
            onChange={(e) => setChangedBy(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="comment">Comment (Optional)</label>
          <textarea
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows="3"
          />
        </div>

        <button type="submit" className="button" disabled={loading}>
          {loading ? 'Updating...' : 'Update Status'}
        </button>
      </form>
    </div>
  );
};

export default UpdateTicketStatus; 