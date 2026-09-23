/**
 * ============================================================================
 * FILE: src/Pages/HomePage.jsx
 * PURPOSE: Public Landing & Welcome Page
 * ============================================================================
 * 
 * Demonstrates:
 * - Publicly accessible homepage for all visitors.
 * - Dynamic call-to-action (CTA) buttons:
 *   If not logged in -> "Sign In" and "Create Account"
 *   If logged in -> Direct jump to role-based dashboard panel.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function HomePage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div style={{ padding: '60px 20px', maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
      {/* Hero Badge */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 16px',
        borderRadius: '24px',
        background: 'var(--accent-bg)',
        border: '1px solid var(--accent-border)',
        color: 'var(--accent)',
        fontWeight: '600',
        fontSize: '14px',
        marginBottom: '24px'
      }}>
        <span>🚀</span>
        <span>Next-Gen Education Management</span>
      </div>

      <h1 style={{ marginBottom: '16px', fontSize: '42px', fontWeight: '800', lineHeight: '1.2' }}>
        Empower Learning & School Administration
      </h1>

      <p style={{ fontSize: '18px', color: 'var(--text)', maxWidth: '650px', margin: '0 auto 36px', lineHeight: '1.6' }}>
        A unified platform connecting administrators, teachers, students, and parents with 
        seamless role-based dashboards, secure authentication, and real-time updates.
      </p>

      {/* Dynamic CTA depending on Auth state */}
      <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {isAuthenticated ? (
          <div style={{
            background: 'var(--code-bg)',
            border: '1px solid var(--border)',
            padding: '24px 32px',
            borderRadius: '16px',
            maxWidth: '450px',
            width: '100%',
            textAlign: 'left'
          }}>
            <h3 style={{ margin: '0 0 8px', color: 'var(--text-h)' }}>
              Welcome back, {user?.fullName}! 👋
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: 'var(--text)' }}>
              Logged in as: <strong style={{ color: 'var(--accent)' }}>{user?.role}</strong> ({user?.email})
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              {user?.role === 'ADMIN' && (
                <Link to="/admin" className="btn-submit" style={{ textDecoration: 'none', padding: '10px 20px', width: 'auto' }}>
                  Open Admin Panel →
                </Link>
              )}
              {user?.role === 'TEACHER' && (
                <Link to="/teacher" className="btn-submit" style={{ textDecoration: 'none', padding: '10px 20px', width: 'auto' }}>
                  Open Teacher Panel →
                </Link>
              )}
              {user?.role === 'STUDENT' && (
                <Link to="/student" className="btn-submit" style={{ textDecoration: 'none', padding: '10px 20px', width: 'auto' }}>
                  Open Student Panel →
                </Link>
              )}
              {user?.role === 'PARENT' && (
                <Link to="/parent" className="btn-submit" style={{ textDecoration: 'none', padding: '10px 20px', width: 'auto' }}>
                  Open Parent Panel →
                </Link>
              )}
              {user?.role === 'PUBLIC_USER' && (
                <span style={{ fontSize: '13px', color: 'var(--text)' }}>
                  Your account has public access. Contact school admin for staff/student enrollment roles.
                </span>
              )}
            </div>
          </div>
        ) : (
          <>
            <Link
              to="/register"
              style={{
                background: 'var(--accent)',
                color: '#fff',
                padding: '14px 28px',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '16px',
                boxShadow: '0 4px 14px rgba(170, 59, 255, 0.3)'
              }}
            >
              Get Started Free →
            </Link>
            <Link
              to="/login"
              style={{
                background: 'var(--code-bg)',
                color: 'var(--text-h)',
                border: '1px solid var(--border)',
                padding: '14px 28px',
                borderRadius: '10px',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '16px'
              }}
            >
              Sign In to Your Panel
            </Link>
          </>
        )}
      </div>

      {/* Role Panel Cards Preview */}
      <div style={{
        marginTop: '60px',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '20px',
        textAlign: 'left'
      }}>
        {[
          { role: 'Admin', desc: 'School operations, staff, & master settings', icon: '🏛️' },
          { role: 'Teacher', desc: 'Attendance, gradebook, & assignments', icon: '📚' },
          { role: 'Student', desc: 'Courses, submissions, & report cards', icon: '🎒' },
          { role: 'Parent', desc: 'Child progress, notices, & fee tracking', icon: '👨‍👩‍👧' },
        ].map((item) => (
          <div key={item.role} style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: 'var(--shadow)'
          }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>{item.icon}</div>
            <h4 style={{ margin: '0 0 6px', color: 'var(--text-h)', fontSize: '16px' }}>{item.role} Panel</h4>
            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text)', lineHeight: '1.4' }}>{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
