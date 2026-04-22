import { Link } from "react-router-dom";

export default function UserPostCard({ post, onEdit, onDelete }) {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: {
        bg: "bg-yellow-100",
        text: "text-yellow-800",
        label: "⏳ Pending approval",
        icon: "⏳",
      },
      published: {
        bg: "bg-green-100",
        text: "text-green-800",
        label: "✅ Approved",
        icon: "✅",
      },
      hidden: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        label: "🔒 Hidden",
        icon: "🔒",
      },
    };

    const badge = badges[status] || badges.draft;
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}
      >
        <span>{badge.icon}</span>
        <span>{badge.label}</span>
      </span>
    );
  };

  const getStatusMessage = (status) => {
    const messages = {
      draft:
        "Your post is pending admin approval. You will be notified once it is approved.",
      published:
        "Your post has been approved and is now publicly visible in the community.",
      hidden: "Your post has been hidden by an admin.",
    };
    return messages[status] || messages.draft;
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-all">
      {post.coverImageUrl && (
        <div className="h-48 overflow-hidden bg-gray-100">
          <img
            src={post.coverImageUrl}
            alt={post.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<div class="h-48 w-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center"><span class="text-6xl">🖼️</span></div>';
            }}
          />
        </div>
      )}

      <div className="p-6">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-xl font-bold text-gray-900 flex-1">
            {post.title}
          </h3>
          {getStatusBadge(post.status)}
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 italic bg-gray-50 p-3 rounded-lg border-l-4 border-orange-500">
            💡 {getStatusMessage(post.status)}
          </p>
        </div>

        {post.excerpt && (
          <p className="text-gray-600 mb-4">{truncateText(post.excerpt, 120)}</p>
        )}

        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>📅 {formatDate(post.createdAt)}</span>
          {post.publishedAt && post.status === "published" && (
            <span className="text-green-600 font-medium">
              ✓ Approved: {formatDate(post.publishedAt)}
            </span>
          )}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          {post.status === "published" && (
            <Link
              to={`/cong-dong/${post.slug}`}
              target="_blank"
              className="flex-1 text-center bg-blue-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-600 transition"
            >
              👁️ View post
            </Link>
          )}
          <button
            onClick={() => onEdit(post)}
            className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 transition"
          >
            ✏️ Edit
          </button>
          <button
            onClick={() => {
              if (
                window.confirm(
                  "Are you sure you want to delete this post? This action cannot be undone."
                )
              ) {
                onDelete(post._id);
              }
            }}
            className="px-4 py-2 border border-red-500 text-red-500 rounded-lg font-semibold hover:bg-red-50 transition"
          >
            🗑️ Delete
          </button>
        </div>
      </div>
    </div>
  );
}
