const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const createTicket = async (ticketData) => {
  try {
    const response = await fetch(`${API_URL}/api/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ticketData),
    });
    return await response.json();
  } catch (error) {
    throw new Error('Failed to create ticket');
  }
};

export const getTicketDetails = async (ticketId) => {
  try {
    const response = await fetch(`${API_URL}/api/tickets/${ticketId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch ticket details');
    }
    return await response.json();
  } catch (error) {
    throw new Error('Failed to fetch ticket details');
  }
};

export const getTicketHistory = async (ticketId) => {
  try {
    const response = await fetch(`${API_URL}/api/tickets/${ticketId}/history`);
    return await response.json();
  } catch (error) {
    throw new Error('Failed to fetch ticket history');
  }
};

export const updateTicketStatus = async (ticketId, newStatus, changedBy, assignedTo, comment) => {
  try {
    const response = await fetch(`${API_URL}/api/tickets/${ticketId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        new_status: newStatus, 
        changed_by: changedBy, 
        assigned_to: assignedTo,
        comment 
      }),
    });
    return await response.json();
  } catch (error) {
    throw new Error('Failed to update ticket status');
  }
}; 