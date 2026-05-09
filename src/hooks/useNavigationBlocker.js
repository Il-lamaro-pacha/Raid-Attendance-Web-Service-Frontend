// src/hooks/useNavigationBlocker.js
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

export function useNavigationBlocker(when = true, message = "You have unsaved changes. Leave anyway?") {
  const navigate = useNavigate();
  const isBlocking = useRef(when);

  // aggiorna stato
  useEffect(() => {
    isBlocking.current = when;
  }, [when]);

  // 🔴 1. refresh / close tab
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (!isBlocking.current) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // 🔴 2. back browser
  useEffect(() => {
    const handlePopState = () => {
      if (!isBlocking.current) return;

      const confirmLeave = window.confirm(message);

      if (!confirmLeave) {
        window.history.pushState(null, "", window.location.href);
      } else {
        isBlocking.current = false;
        navigate(-1);
      }
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigate, message]);

  // 🔴 3. safe navigate wrapper
  const safeNavigate = (to, options) => {
    if (!isBlocking.current) {
      navigate(to, options);
      return;
    }

    const confirmLeave = window.confirm(message);

    if (confirmLeave) {
      isBlocking.current = false;
      navigate(to, options);
    }
  };

  return { safeNavigate };
}