import { useState, useEffect } from 'react';
import { authApi } from '../../utils/services/api';

export default function SessionManagement() {
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
    if (!confirm('Bạn có chắc muốn đăng xuất khỏi thiết bị này?')) return;

    try {
      await authApi.revokeSession(sessionId);
      await loadSessions(); // Reload sessions
    } catch (err) {
      alert('Không thể thu hồi session: ' + err.message);
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm('Bạn có chắc muốn đăng xuất khỏi TẤT CẢ thiết bị? Bạn sẽ bị đăng xuất ngay lập tức.')) return;

    try {
      await authApi.logoutAll();
      // Clear local storage
      localStorage.removeItem('pawhouse_token');
      localStorage.removeItem('pawhouse_user');
      // Redirect to login
      window.location.href = '/dang-nhap';
    } catch (err) {
      alert('Không thể đăng xuất tất cả: ' + err.message);
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
            <h2 className="text-2xl font-bold text-gray-800">Quản lý phiên đăng nhập</h2>
            <p className="text-gray-600 mt-1">Xem và quản lý các thiết bị đang đăng nhập vào tài khoản của bạn</p>
          </div>
          <button
            onClick={handleLogoutAll}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            Đăng xuất tất cả
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
              <p className="text-gray-500">Không có phiên đăng nhập nào</p>
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
                          {session.device || 'Thiết bị không xác định'}
                        </h3>
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                          Đang hoạt động
                        </span>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <span>{getBrowserIcon(session.browser)}</span>
                          <span>{session.browser || 'Không xác định'} trên {session.os || 'Không xác định'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>📍</span>
                          <span>{session.ip || 'IP không xác định'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>🕐</span>
                          <span>Đăng nhập: {formatDate(session.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span>⚡</span>
                          <span>Hoạt động gần nhất: {formatDate(session.lastActivityAt)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevokeSession(session.id)}
                    className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    Thu hồi
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
              <p className="font-medium mb-1">Lưu ý về bảo mật:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Nếu bạn thấy thiết bị không quen thuộc, hãy thu hồi ngay lập tức</li>
                <li>Sử dụng "Đăng xuất tất cả" nếu bạn nghi ngờ tài khoản bị xâm nhập</li>
                <li>Thay đổi mật khẩu ngay nếu phát hiện hoạt động đáng ngờ</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
