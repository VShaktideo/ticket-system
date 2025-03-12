import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import CreateTicket from './components/CreateTicket';
import TicketDetails from './components/TicketDetails';
import TicketList from './components/TicketList';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="header">
          <h1>Ticket System</h1>
          <nav>
            <Link to="/" className="button">Home</Link>
            <Link to="/tickets" className="button">All Tickets</Link>
            <Link to="/create-ticket" className="button">Create Ticket</Link>
          </nav>
        </header>

        <div className="container">
          <Routes>
            <Route path="/create-ticket" element={<CreateTicket />} />
            <Route path="/ticket/:ticketId" element={<TicketDetails />} />
            <Route path="/tickets" element={<TicketList />} />
            <Route path="/" element={<h2>Welcome to the Ticket System</h2>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
