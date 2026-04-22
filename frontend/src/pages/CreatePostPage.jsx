import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header, Footer } from "../components/layout";
import UserPostForm from "../components/user/UserPostForm";
import { STORAGE_KEYS } from "../utils/constants";
import { isAdminUser, isStaffUser } from "../utils/role";

export default function CreatePostPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Only admin/staff can create posts
    const userData = localStorage.getItem(STORAGE_KEYS.USER);
    if (!userData) {
      alert("Please log in to create a post");
      navigate("/login");
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      const canCreate = isAdminUser(parsedUser) || isStaffUser(parsedUser);
      if (!canCreate) {
        alert("You do not have permission to create posts. Only staff or admins may publish.");
        navigate("/cong-dong");
        return;
      }
      setUser(parsedUser);
    } catch {
      alert("Unable to verify account permissions. Please log in again.");
      navigate("/login");
    }
  }, [navigate]);

  const handleSuccess = () => {
    alert("Your post has been submitted successfully! It will be reviewed and approved by an administrator.");
    navigate("/cong-dong");
  };

  const handleCancel = () => {
    navigate("/cong-dong");
  };

  if (!user) {
    return null; // or loading spinner
  }

  return (
    <div className="font-['Inter',sans-serif] bg-linear-to-br from-orange-50 via-amber-50 to-orange-50 min-h-screen">
      <Header />

      {/* Hero Section with Animation */}
      <div className="relative overflow-hidden pt-24 pb-8">
        <div className="absolute inset-0 bg-linear-to-r from-orange-500/10 to-amber-500/10"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-amber-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-orange-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm rounded-full shadow-md mb-6 animate-fade-in-down">
            <span className="text-2xl">✨</span>
            <span className="text-sm font-semibold text-orange-600">Share your story</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-4 animate-fade-in-up">
            <span className="bg-linear-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Create New Post
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto animate-fade-in-up animation-delay-200">
            Share your experiences, stories, and knowledge about your pets with the PawHouse community
          </p>
        </div>
      </div>

      {/* Main Form Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <UserPostForm onSuccess={handleSuccess} onCancel={handleCancel} user={user} />
      </main>

      <Footer />
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(20px, 50px) scale(1.05); }
        }
        @keyframes fade-in-down {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.6s ease-out;
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
        .animation-delay-200 {
          animation-delay: 0.2s;
          animation-fill-mode: both;
        }
      `}} />
    </div>
  );
}
