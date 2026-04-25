import { useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { notifications } from "@mantine/notifications";
import {
  setUserName,
  setRollNo,
  setRoles,
  setRole,
  setAccessibleModules,
  setCurrentAccessibleModules,
  clearUserName,
  clearRoles,
  setPhcRole,
} from "../redux/userslice";
import { authRoute } from "../routes/globalRoutes";
import logger from "../utils/logger";
import { clearAuthSession, getValidAuthToken } from "./sessionManager";

function ValidateAuth() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const hasValidated = useRef(false);

  const validateUser = useCallback(async () => {
    const token = getValidAuthToken();

    if (!token) {
      logger.warn("Authentication token missing");
      clearAuthSession();
      navigate("/accounts/login");
      return;
    }

    try {
      const { data } = await axios.get(authRoute, {
        headers: { Authorization: `Token ${token}` },
      });

      const {
        name,
        designation_info = [],
        accessible_modules = [],
        last_selected_role,
        roll_no,
        phc_role,
      } = data;

      dispatch(setUserName(name));
      dispatch(setRollNo(roll_no));
      dispatch(setRoles(designation_info));

      const selectedRole = last_selected_role || designation_info[0] || null;
      if (selectedRole) dispatch(setRole(selectedRole));

      dispatch(setAccessibleModules(accessible_modules));
      dispatch(setCurrentAccessibleModules());
      dispatch(setPhcRole(phc_role || null));
    } catch (error) {
      logger.error("User validation failed", error);
      clearAuthSession();
      dispatch(clearUserName());
      dispatch(clearRoles());
      navigate("/accounts/login");
    }
  }, [dispatch, navigate]);

  useEffect(() => {
    // Only validate once on component mount
    if (!hasValidated.current) {
      hasValidated.current = true;
      validateUser();
    }
  }, []); // Empty dependency array - runs only once

  return null;
}

export default ValidateAuth;
