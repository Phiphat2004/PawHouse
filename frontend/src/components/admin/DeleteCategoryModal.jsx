import { useState } from "react";

export default function DeleteCategoryModal({ category, onConfirm, onCancel }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onConfirm(category._id);
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all relative z-[10000]">
        {/* Content */}
        <div className="p-8 text-center space-y-6">
          {/* Warning Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900">
            Confirm category deletion
          </h2>

          {/* Message */}
          <p className="text-gray-600">
            Are you sure you want to delete category{" "}
            <span className="font-bold text-gray-900">{category.name}</span>
            ?
          </p>

          {/* Warning Text */}
          <p className="text-red-600 font-medium text-sm">
            This action cannot be undone.
          </p>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:bg-red-400 disabled:cursor-not-allowed"
            >
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
