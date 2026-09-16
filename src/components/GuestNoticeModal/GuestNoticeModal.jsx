import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext.jsx";
import "./GuestNoticeModal.css";

const STORAGE_KEY = "guest_notice_seen";

export default function GuestNoticeModal() {
  const { user, loading } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user) return;

    const alreadySeen = window.localStorage?.getItem(STORAGE_KEY);
    if (!alreadySeen) {
      setVisible(true);
    }
  }, [user, loading]);

  function handleClose() {
    window.localStorage?.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="guest-notice-overlay" onClick={handleClose}>
      <div className="guest-notice-modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="guest-notice-modal__close"
          onClick={handleClose}
          aria-label="إغلاق"
        >
          ×
        </button>
        <h2 className="guest-notice-modal__title">أهلاً بيك في متجرنا</h2>
        <p className="guest-notice-modal__text">
          تقدر تتصفح كل المنتجات بحرية، لكن عشان تقدر تطلب عرض سعر أو تتواصل معانا، محتاج تعمل حساب أو تسجل الدخول الأول.
        </p>
        <div className="guest-notice-modal__actions">
          <Link to="/login" className="guest-notice-modal__cta" onClick={handleClose}>
            تسجيل الدخول / إنشاء حساب
          </Link>
          <button type="button" className="guest-notice-modal__dismiss" onClick={handleClose}>
            تصفح الأول
          </button>
        </div>
      </div>
    </div>
  );
}