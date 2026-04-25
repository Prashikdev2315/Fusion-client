import { useNavigate } from "react-router-dom";
import { showNotification } from "@mantine/notifications";
import axios from "axios";
import { CheckCircle, XCircle } from "@phosphor-icons/react"; // Optional for adding icons to notifications
import { logoutRoute } from "../routes/dashboardRoutes";
import logger from "../utils/logger";
import { clearAuthSession, getValidAuthToken } from "./sessionManager";

const useLogout = () => {
  const navigate = useNavigate();

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
      navigate("/accounts/login");

      // Show success notification
      showNotification({
        title: "Logged Out",
        message: "You have been logged out successfully.",
        color: "green", // Customize color
        icon: <CheckCircle size={18} />,
      });

      logger.info("User logged out successfully");
    } catch (err) {
      logger.error("Logout failed", err);

      // Show error notification
      showNotification({
        title: "Logout Failed",
        message: "There was an issue logging you out. Please try again.",
        color: "red", // Customize color
        icon: <XCircle size={18} />,
      });
    }
  };

  return { handleLogout };
};

export default useLogout;
