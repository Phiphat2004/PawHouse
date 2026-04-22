import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../../utils/services/api';

export default function SessionManagement() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await authApi.getActiveSessions();
      setSessions(data.sessions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeSession = async (sessionId) => {
    if (!confirm('Are you sure you want to sign out from this device?')) return;

    try {
      await authApi.revokeSession(sessionId);
      await loadSessions(); // Reload sessions
    } catch (err) {
      alert('Cannot revoke session: ' + err.message);
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm('Are you sure you want to sign out from ALL devices? You will be signed out immediately.')) return;

    try {
      await authApi.logoutAll();
      // Clear local storage
      localStorage.removeItem('pawhouse_token');
      localStorage.removeItem('pawhouse_user');
      // Redirect to login without forcing a full page reload
      navigate('/login', { replace: true });
    } catch (err) {
      alert('Cannot sign out all devices: ' + err.message);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDeviceIcon = (device) => {
    switch (device?.toLowerCase()) {
      case 'mobile': return '📱';
      case 'tablet': return '📱';
      case 'desktop': return '💻';
      default: return '🖥️';
    }
  };

  const getBrowserIcon = (browser) => {
    switch (browser?.toLowerCase()) {
      case 'chrome': return '🌐';
      case 'firefox': return '🦊';
      case 'safari': return '🧭';
      case 'edge': return '🌊';
      default: return '🌍';
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Login Session Management</h2>
            <p className="text-gray-600 mt-1">View and manage devices currently signed in to your account</p>
          </div>
          <button
            onClick={handleLogoutAll}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Sign out all devices
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {sessions.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No active login sessions</p>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="text-4xl">
                      {getDeviceIcon(session.device)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">
                          {session.device || 'Unknown device'}
                        </h3>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                          Active
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <span>{getBrowserIcon(session.browser)}</span>
                          <span>{session.browser || 'Unknown'} on {session.os || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>📍</span>
                          <span>{session.ip || 'Unknown IP'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>🕐</span>
                          <span>Logged in: {formatDate(session.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>⚡</span>
                          <span>Last active: {formatDate(session.lastActivityAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevokeSession(session.id)}
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Revoke
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex gap-2">
            <span className="text-blue-500">ℹ️</span>
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Security notes:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>If you see an unfamiliar device, revoke it immediately</li>
                <li>Use "Sign out all devices" if you suspect your account is compromised</li>
                <li>Change your password immediately if you detect suspicious activity</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
