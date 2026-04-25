import axios from "axios";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import { logoutRoute } from "../routes/dashboardRoutes";
import logger from "../utils/logger";
import { clearAuthSession, getValidAuthToken } from "./sessionManager";

function InactivityHandler() {
  const timerRef = useRef(null);
  const [hasLoggedOut, setHasLoggedOut] = useState(false);
  const navigate = useNavigate();
  const INACTIVITY_TIME = 15 * 60 * 1000; // 15 minutes

  const handleLogout = async () => {
    const token = getValidAuthToken();

    try {
      await axios.post(
        logoutRoute,
        {},
        {
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      clearAuthSession();

      // Show notification only once
      if (!hasLoggedOut) {
        setHasLoggedOut(true);
        notifications.show({
          title: "User logged out",
          message:
            "You have been logged out due to inactivity. Please login again.",
          color: "red",
        });
      }

      navigate("/accounts/login");
      logger.info("User logged out successfully");
    } catch (err) {
      logger.error("Logout failed", err);
      clearAuthSession();
      navigate("/accounts/login");
    }
  };

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      handleLogout();
    }, INACTIVITY_TIME);
  };

  useEffect(() => {
    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((event) => document.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      events.forEach((event) =>
        document.removeEventListener(event, resetTimer),
      );
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []); // Dependency array stays empty

  return null;
}

export default InactivityHandler;
