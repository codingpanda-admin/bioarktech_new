import React from 'react';
import { logo } from '../utils/api';

function AdminHeader({ navigate, onLogout }) {
  return (
    <header className="admin-header">
      <div className="admin-topbar">
        <div className="admin-brand" aria-label="Bio Ark Tech" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="Bio Ark Tech" />
        </div>
        <h1>Admin Console</h1>
        <div className="admin-header-actions">
          <a className="admin-home-button" href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }}>Homepage</a>
          <button className="admin-auth-button" type="button" onClick={onLogout}>Sign Out</button>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
