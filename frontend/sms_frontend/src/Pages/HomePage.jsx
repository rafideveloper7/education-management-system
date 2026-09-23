/**
 * ============================================================================
 * FILE: src/Pages/HomePage.jsx
 * PURPOSE: Public Landing Welcome Hero with clear brief message & quick links
 * ============================================================================
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Hero Container */}
      <section style={{
        padding: '70px 20px',
        maxWidth: '1100px',
        margin: '0 auto',
        textAlign: 'center',
        width: '100%',
      }}>
        {/* Institutional Pill Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '6px 18px',
          borderRadius: '9999px',
          background: 'var(--kims-accent-light)',
          border: '1px solid rgba(5, 150, 105, 0.25)',
          color: 'var(--kims-emerald)',
          fontWeight: '700',
          fontSize: '13px',
          marginBottom: '28px',
          boxShadow: '0 2px 8px rgba(6, 78, 59, 0.06)'
        }}>
          <span style={{ color: 'var(--kims-gold)' }}>★</span>
          <span>Kohat Institute of Modern Sciences • Digital Campus</span>
        </div>

        {/* Main Title */}
        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 54px)',
          fontWeight: '800',
          color: 'var(--kims-dark)',
          lineHeight: '1.15',
          letterSpacing: '-1px',
          marginBottom: '20px'
        }}>
          Come to Read, <span style={{ color: 'var(--kims-accent)' }}>Go to Lead.</span>
        </h1>

        {/* Concise Message requested by user */}
        <p style={{
          fontSize: 'clamp(16px, 2vw, 19px)',
          color: 'var(--text-muted)',
          maxWidth: '680px',
          margin: '0 auto 36px',
          lineHeight: '1.6'
        }}>
          Welcome to the official digital portal of KIMS. Connect to your institutional workspace, 
          manage school operations, track student progress, or apply online for admissions.
        </p>

       

        {/* 5 Workspaces Showcase Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px',
          textAlign: 'left'
        }}>
          {[
            { role: 'Admin', desc: 'Control institutional settings, staff & records', icon: 'fa-user-shield', color: '#f59e0b' },
            { role: 'Teacher', desc: 'Manage syllabus, attendance & grade books', icon: 'fa-chalkboard-user', color: '#3b82f6' },
            { role: 'Student', desc: 'Access subjects, homework & report cards', icon: 'fa-graduation-cap', color: '#10b981' },
            { role: 'Parent', desc: 'Track child performance, dues & notices', icon: 'fa-people-roof', color: '#8b5cf6' },
            { role: 'Public', desc: 'Online admissions, inquiries & updates', icon: 'fa-user', color: '#14b8a6' },
          ].map((item) => (
            <div key={item.role} style={{
              background: '#ffffff',
              border: '1px solid var(--border-card)',
              borderRadius: '16px',
              padding: '20px',
              boxShadow: 'var(--shadow-subtle)',
              transition: 'transform 0.2s ease'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'rgba(6, 78, 59, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px'
              }}>
                <i className={`fa-solid ${item.icon}`} style={{ color: item.color, fontSize: '18px' }}></i>
              </div>
              <h4 style={{ margin: '0 0 6px', color: 'var(--text-dark)', fontSize: '15px', fontWeight: '800' }}>
                {item.role} Portal
              </h4>
              <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4' }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
