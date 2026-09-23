/**
 * ============================================================================
 * FILE: src/Panels/Admin/AdminDashboard.jsx
 * PURPOSE: Admin Panel Entry Dashboard (Isolated UI)
 * ============================================================================
 */

import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div style={{ padding: '30px', textAlign: 'left', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid var(--border)',
        paddingBottom: '20px',
        marginBottom: '24px'
      }}>
        <div>
          <h1 style={{ margin: '0 0 6px 0', fontSize: '28px' }}>Admin Dashboard 🏛️</h1>
          <p style={{ margin: 0, color: 'var(--text)' }}>
            Welcome, <strong>{user?.fullName}</strong> ({user?.email})
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/')}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid var(--border)',
              background: 'var(--code-bg)',
              cursor: 'pointer'
            }}
          >
            ← Public Site
          </button>
          <button
            onClick={handleLogout}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #ef4444',
              color: '#ef4444',
              background: 'transparent',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px'
      }}>
        <div style={{ padding: '20px', borderRadius: '12px', background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 8px 0' }}>Role</h3>
          <p style={{ fontSize: '20px', fontWeight: '700', color: 'var(--accent)', margin: 0 }}>
            {user?.role}
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '12px', background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 8px 0' }}>Account Status</h3>
          <p style={{ fontSize: '20px', fontWeight: '700', color: '#16a34a', margin: 0 }}>
            {user?.status}
          </p>
        </div>
        <div style={{ padding: '20px', borderRadius: '12px', background: 'var(--code-bg)', border: '1px solid var(--border)' }}>
          <h3 style={{ margin: '0 0 8px 0' }}>Panel UI Isolation</h3>
          <p style={{ fontSize: '14px', color: 'var(--text)', margin: 0 }}>
            Dedicated components live in <code>src/Panels/Admin/</code>
          </p>
        </div>
      </div>
    </div>
  );
}
