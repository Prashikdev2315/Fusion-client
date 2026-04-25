import {
  Button,
  Container,
  PasswordInput,
  TextInput,
  Title,
  Text,
  Box,
  Stack,
  Group,
  Transition,
  rem,
  UnstyledButton,
  Badge,
} from "@mantine/core";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { notifications } from "@mantine/notifications";
import { loginRoute } from "../routes/globalRoutes";
import iiitdmjLogo from "../assets/iiitdmj_logo.png";
import iiitdmjLogoMobile from "../assets/IIITJ_logo.webp";
import { getValidAuthToken, setAuthSession } from "../helper/sessionManager";

const CONFIG = {
  MOBILE_BREAKPOINT: 768,
  CLOCK_UPDATE_INTERVAL: 1000,
  RESIZE_DEBOUNCE_DELAY: 150,
  MOUSE_TRACKING_THROTTLE: 50,
  AUTH_SUCCESS_DELAY: 500,
  PASSWORD_RESET_URL: "http://fusion.iiitdmj.ac.in:6310/password-reset/",
};

const NOTIFICATION_STYLES = {
  success: {
    root: {
      background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      border: 'none',
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)',
      backdropFilter: 'blur(10px)',
      minHeight: '60px',
      maxWidth: '400px',
    },
    title: { 
      color: '#fff',
      fontWeight: 800,
      fontSize: '13px',
      letterSpacing: '1.5px',
      fontFamily: 'monospace',
      textTransform: 'uppercase',
      marginBottom: '4px',
    },
    description: { 
      color: 'rgba(255,255,255,0.95)',
      fontSize: '12px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      lineHeight: '1.4',
      fontWeight: 500,
    }
  },
  error: {
    root: {
      background: 'linear-gradient(135deg, #FF6B35 0%, #F7931E 100%)',
      border: 'none',
      padding: '12px 16px',
      borderRadius: '8px',
      boxShadow: '0 8px 24px rgba(255, 107, 53, 0.25)',
      backdropFilter: 'blur(10px)',
      minHeight: '60px',
      maxWidth: '400px',
    },
    title: { 
      color: '#fff',
      fontWeight: 800,
      fontSize: '13px',
      letterSpacing: '1.5px',
      fontFamily: 'monospace',
      textTransform: 'uppercase',
      marginBottom: '4px',
    },
    description: { 
      color: 'rgba(255,255,255,0.95)',
      fontSize: '12px',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      lineHeight: '1.4',
      fontWeight: 500,
    },
    closeButton: {
      color: '#fff',
      borderRadius: '50%',
      transition: 'all 0.2s ease',
      width: '20px',
      height: '20px',
      minWidth: '20px',
      minHeight: '20px',
      '&:hover': {
        backgroundColor: 'rgba(255,255,255,0.2)',
        transform: 'scale(1.1)',
      }
    }
  }
};

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

const throttle = (func, limit) => {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

const getPasswordStrength = (password) => {
  if (password.length < 6) return { label: 'weak', color: 'red' };
  if (password.length < 10) return { label: 'medium', color: 'yellow' };
  return { label: 'strong', color: 'green' };
};

const getPasswordGradient = (length) => {
  if (length < 6) return 'linear-gradient(90deg, #EF4444 0%, #DC2626 100%)';
  if (length < 10) return 'linear-gradient(90deg, #F59E0B 0%, #D97706 100%)';
  return 'linear-gradient(90deg, #10B981 0%, #059669 100%)';
};

function LoginPage() {
  const navigate = useNavigate();

  const initialIsMobile = useMemo(() => window.innerWidth <= CONFIG.MOBILE_BREAKPOINT, []);

  const [view, setView] = useState("landing");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [inputFocus, setInputFocus] = useState(null);
  const [shake, setShake] = useState(false);
  const [currentDate, setCurrentDate] = useState(
    new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()
  );
  const [isMobile, setIsMobile] = useState(initialIsMobile);

  const isLogin = useMemo(() => view === "login", [view]);
  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);
  const isFormValid = useMemo(() => username.trim() && password.trim(), [username, password]);

  const handleMouseMove = useCallback(
    throttle((e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    }, CONFIG.MOUSE_TRACKING_THROTTLE),
    []
  );

  const handleKeyPress = useCallback((e) => {
    if (e.key === 'Enter' && view === 'landing') {
      setView('login');
    }
  }, [view]);

  const handleResize = useCallback(
    debounce(() => {
      const mobile = window.innerWidth <= CONFIG.MOBILE_BREAKPOINT;
      setIsMobile(mobile);
      if (mobile && view === 'landing') {
        setView('login');
      }
    }, CONFIG.RESIZE_DEBOUNCE_DELAY),
    [view]
  );

  const handlePasswordReset = useCallback(() => {
    window.location.href = CONFIG.PASSWORD_RESET_URL;
  }, []);

  const handleDismissSession = useCallback(() => {
    setView("landing");
  }, []);

  useEffect(() => {
    const token = getValidAuthToken();
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase());
    }, CONFIG.CLOCK_UPDATE_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!isFormValid || loading) return;
    
    setLoading(true);
    
    try {
      const response = await axios.post(loginRoute, { 
        username: username.trim(), 
        password: password.trim() 
      }, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.status === 200 && response.data?.token) {
        setAuthSession(response.data.token);
        
        notifications.show({ 
          message: "Authentication successful", 
          color: "green",
        });
        
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, CONFIG.AUTH_SUCCESS_DELAY);
      }
    } catch (err) {
      setShake(true);
      const shakeTimer = setTimeout(() => setShake(false), 500);

      let errorMessage = "Invalid username or password. Please check your credentials.";
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = "Request timeout. Please check your internet connection and try again.";
      } else if (err.response) {
        const status = err.response.status;
        const serverMessage = err.response.data?.message || err.response.data?.error;
        
        if (status === 400) {
          errorMessage = serverMessage || "Invalid credentials. Please check your username and password.";
        } else if (status === 401) {
          errorMessage = serverMessage || "Incorrect username or password. Please try again.";
        } else if (status === 403) {
          errorMessage = serverMessage || "Account access restricted. Please contact administration.";
        } else if (status === 404) {
          errorMessage = "Authentication service unavailable. Please try again later.";
        } else if (status === 500 || status === 502 || status === 503) {
          errorMessage = "Server temporarily unavailable. Please try again in a moment.";
        } else if (serverMessage) {
          errorMessage = serverMessage;
        } else {
          errorMessage = "Authentication failed. Please try again.";
        }
      } else if (err.request) {
        errorMessage = "Cannot reach server. Please check your internet connection.";
      }
      
      notifications.show({ 
        title: "⚠ ACCESS DENIED", 
        message: errorMessage, 
        color: "orange",
        autoClose: 5000,
        withCloseButton: true,
        styles: () => NOTIFICATION_STYLES.error
      });
      
      return () => clearTimeout(shakeTimer);
    } finally {
      setLoading(false);
    }
  }, [username, password, loading, isFormValid, navigate]);

  return (
    <Box
      style={{
        height: "100vh",
        background: "linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%)",
        overflow: "hidden",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <Box
        style={{
          position: "absolute",
          top: mousePos.y - 200,
          left: mousePos.x - 200,
          width: 400,
          height: 400,
          background: "radial-gradient(circle, rgba(21,171,255,0.08) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
          transition: "all 0.3s ease-out",
          zIndex: 1,
        }}
      />
      <Box
        style={{
          position: "absolute",
          top: "20%",
          right: "10%",
          width: 600,
          height: 600,
          background: "radial-gradient(circle, rgba(21,171,255,0.05) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
          animation: "float 20s ease-in-out infinite",
          zIndex: 1,
        }}
      />

      <Box
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          opacity: 0.3,
          backgroundImage: `
            repeating-linear-gradient(45deg, #DEE2E6, #DEE2E6 1px, transparent 1px, transparent ${isLogin ? '20px' : '100px'}),
            radial-gradient(#DEE2E6 1.2px, transparent 1.2px)
          `,
          backgroundSize: isLogin ? "20px 20px, 20px 20px" : "100px 100px, 40px 40px",
          transition: "all 1.5s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.95); }
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-10px); }
          20%, 40%, 60%, 80% { transform: translateX(10px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shimmer {
          0%, 100% { background-position: 200% 0; }
          50% { background-position: -200% 0; }
        }
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(21,171,255,0.3); }
          50% { box-shadow: 0 0 40px rgba(21,171,255,0.6); }
        }
        
        @media (max-width: 768px) {
          .header-container { padding: 8px 12px !important; }
          .header-group { flex-direction: column !important; gap: 8px !important; justify-content: center !important; align-items: center !important; }
          .logo-section { justify-content: center !important; flex-direction: row !important; align-items: center !important; }
          .status-section { display: none !important; }
          .outline-text { font-size: 80px !important; letter-spacing: -8px !important; }
          .to-text { font-size: 32px !important; }
          .main-title { font-size: 36px !important; }
          .kinetic-assembly { flex-direction: column !important; }
          .welcome-slab { width: 100% !important; padding: 40px 20px !important; display: flex !important; }
          .welcome-slab.minimized { display: none !important; }
          .login-slab { width: 100% !important; min-height: calc(100vh - 140px) !important; display: none !important; padding: 10px !important; }
          .login-slab.active { display: flex !important; }
          .login-container { max-width: 100% !important; padding: 0 20px !important; }
          .access-button { padding: 16px 40px !important; width: 100% !important; max-width: 100% !important; }
          .footer-container { padding: 8px 12px !important; }
          .mobile-header-text { display: flex !important; flex-direction: column !important; gap: 2px !important; line-height: 1.2 !important; }
          .mobile-header-text .mantine-Text-root { font-size: 9px !important; margin: 0 !important; padding: 0 !important; }
        }
        
        @media (max-width: 480px) {
          .outline-text { font-size: 60px !important; letter-spacing: -5px !important; }
          .main-title { font-size: 28px !important; }
          .login-container { padding: 0 15px !important; max-width: 100% !important; }
          .header-logo { height: 28px !important; }
          .auth-button { height: 48px !important; font-size: 11px !important; padding: 0 16px !important; }
          .header-container { padding: 6px 10px !important; }
          .footer-container { padding: 6px 10px !important; }
        }
      `}</style>

      {/* HEADER */}
      <Box 
        p="md" 
        className="header-container"
        style={{ 
          zIndex: 100, 
          borderBottom: '2px solid #111', 
          backgroundColor: 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(20px) saturate(180%)',
          boxShadow: '0 4px 30px rgba(0,0,0,0.05)',
          animation: 'slideIn 0.8s ease-out'
        }}
      >
        <Container size="xl">
          <Group justify="space-between" className="header-group">
            <Group gap="md" className="logo-section">
              <Box style={{ 
                position: 'relative'
              }}>
                <img 
                  src={isMobile ? iiitdmjLogoMobile : iiitdmjLogo}
                  alt="IIITDMJ Logo" 
                  className="header-logo"
                  style={{ 
                    height: 40
                  }} 
                />
              </Box>
              <Box 
                className={isMobile ? "mobile-header-text" : ""}
                style={{ 
                  borderLeft: isMobile ? "2px solid #15ABFF" : "3px solid #15ABFF", 
                  paddingLeft: isMobile ? 8 : 15,
                  background: isMobile ? 'transparent' : 'linear-gradient(90deg, rgba(21,171,255,0.05) 0%, transparent 100%)',
                  paddingRight: isMobile ? 0 : 15
                }}>
                <Text fw={900} size={isMobile ? "xs" : "sm"} lts={1} c="#111">
                  PDPM IIITDM <span style={{ 
                    color: "#15ABFF",
                    textShadow: isMobile ? 'none' : '0 0 10px rgba(21,171,255,0.3)'
                  }}>JABALPUR</span>
                </Text>
                <Text size="xs" c="dimmed" fw={800} style={{ 
                  fontFamily: 'monospace',
                  letterSpacing: isMobile ? 1 : 2
                }}>
                  FUSION
                </Text>
              </Box>
            </Group>
            <Group gap="sm" className="status-section">
              <Text size="xs" c="dimmed" fw={800} style={{ fontFamily: 'monospace' }}>
                {currentDate}
              </Text>
            </Group>
          </Group>
        </Container>
      </Box>

      <Box className="kinetic-assembly" style={{ flex: 1, display: "flex", position: 'relative', overflow: 'hidden' }}>

        <Box 
          className={`welcome-slab ${isLogin ? 'minimized' : ''}`}
          style={{ 
            width: isLogin ? '35%' : '100%',
            height: '100%',
            transition: 'all 1s cubic-bezier(0.8, 0, 0.1, 1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: isLogin ? '40px 40px 40px 20px' : '0 10%',
            background: isLogin 
              ? 'linear-gradient(135deg, rgba(248, 249, 250, 0.2) 0%, rgba(255, 255, 255, 0.25) 100%)' 
              : 'transparent',
            borderRight: 'none',
            boxShadow: isLogin ? '10px 0 30px rgba(0,0,0,0.05)' : 'none',
            zIndex: 20,
            position: 'relative'
          }}
        >
          {isLogin && (
            <Box
              style={{
                position: 'absolute',
                right: 0,
                top: '10%',
                bottom: '10%',
                width: '4px',
                background: 'linear-gradient(180deg, transparent 0%, #15ABFF 50%, transparent 100%)',
                boxShadow: '0 0 20px rgba(21, 171, 255, 0.5), 0 0 40px rgba(21, 171, 255, 0.3)',
                borderRadius: '2px',
                animation: 'glow 2s ease-in-out infinite',
                zIndex: 30
              }}
            />
          )}
          <Stack gap={0} style={{ animation: 'slideIn 0.8s ease-out' }}>
             <Text 
                fw={900} 
                className="outline-text"
                style={{ 
                    fontSize: isLogin ? rem(60) : rem(200), 
                    lineHeight: 0.7, 
                    letterSpacing: isLogin ? ' 1px' : '-10px', 
                    color: 'transparent',
                    WebkitTextStroke: isLogin ? '3.5px #64f5f5ff' : '3px #DEE2E6',
                    WebkitTextFillColor: 'transparent',
                    transition: 'all 1s ease',
                    // textShadow: isLogin ? '0 0 20px rgba(11,141,217,0.3)' : 'none'
                }}
             >
                WELCOME
             </Text>
             <Box mt={isLogin ? 10 : -30}>
                <Box style={{ display: 'inline-block' }}>
                  <Text 
                    size={isLogin ? rem(20) : rem(48)} 
                    fw={900} 
                    lts={-1} 
                    ta="center"
                    className="to-text" 
                    style={{ 
                      marginBottom: isLogin ? -5 : -15,
                      background: 'linear-gradient(135deg, #15ABFF 0%, #111 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>TO</Text>
                  <Title 
                    order={1} 
                    fw={900} 
                    size={isLogin ? rem(28) : rem(64)} 
                    lts={-2} 
                    className="main-title"
                    style={{
                      background: 'linear-gradient(135deg, #111 0%, #15ABFF 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text'
                    }}>
                    FUSION
                  </Title>
                </Box>
                {!isLogin && (
                   <Text c="dimmed" fw={600} size="xs" mt="xl" lts={5}></Text>
                )}
             </Box>

             {!isLogin && (
                <Box>
                  <UnstyledButton
                    onClick={() => setView("login")}
                    mt={80}
                    className="access-button"
                    style={{
                      padding: '24px 80px', 
                      background: 'linear-gradient(135deg, #111 0%, #15ABFF 100%)',
                      color: '#FFF',
                      borderRadius: 0, 
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', 
                      width: 'fit-content',
                      boxShadow: '0 10px 40px rgba(21,171,255,0.3)',
                      position: 'relative',
                      overflow: 'hidden',
                      margin: '0 auto'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 15px 50px rgba(21,171,255,0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 10px 40px rgba(21,171,255,0.3)';
                    }}
                  >
                    <Text fw={900} lts={4} size="sm">Login →</Text>
                  </UnstyledButton>
                </Box>
             )}
          </Stack>
        </Box>

        <Box 
          className={`login-slab ${isLogin ? 'active' : ''}`}
          style={{ 
            flex: isLogin ? 1 : 0,
            backgroundColor: "#FFFFFF",
            transition: 'all 1s cubic-bezier(0.8, 0, 0.1, 1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden'
          }}
        >
          <Transition mounted={isLogin} transition="slide-left" duration={1000}>
            {(styles) => (
              <Container size={380} w="100%" className="login-container" style={{...styles, animation: shake ? 'shake 0.5s ease-in-out' : 'none'}}>
                <Stack gap={isMobile ? 25 : 50}>
                  <Box>
                    <UnstyledButton 
                      onClick={handleDismissSession} 
                      mb={isMobile ? "sm" : "xl"}
                      aria-label="Return to landing page"
                      style={{
                        transition: 'all 0.3s ease',
                        display: isMobile ? 'none' : 'inline-block'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(-5px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
                    >
                       <Text size="xs" fw={900} c="blue" lts={1}>← BACK</Text>
                    </UnstyledButton>
                  <Box style={{ position: 'relative' }}>
                    <Title order={2} fw={900} size={isMobile ? "28px" : "36px"} lts={-1}>Login</Title>
                    <Box 
                      style={{ 
                        position: 'absolute',
                        bottom: -5,
                        left: 0,
                        width: 60,
                        height: 3,
                        background: 'linear-gradient(90deg, #15ABFF 0%, transparent 100%)',
                        animation: 'slideIn 0.5s ease-out, glow 2s ease-in-out infinite'
                      }} 
                    />
                  </Box>
                  <form onSubmit={handleSubmit} style={{ marginTop: isMobile ? '30px' : '40px' }}>
                    <Stack gap={isMobile ? "lg" : "xl"}>
                      <Box style={{ position: 'relative' }}>
                        <TextInput
                          label={
                            <Text size="xs" fw={800} c="gray.6" mb={5}>USERNAME</Text>
                          }
                          placeholder="Roll No / Username"
                          variant="unstyled" 
                          size="lg" 
                          radius={0}
                          value={username} 
                          onChange={(e) => setUsername(e.target.value)}
                          onFocus={() => setInputFocus('username')}
                          onBlur={() => setInputFocus(null)}
                          required
                          autoComplete="username"
                          style={{ 
                            borderBottom: inputFocus === 'username' 
                              ? '2px solid #15ABFF' 
                              : '2px solid #E9ECEF',
                            transition: 'all 0.3s ease',
                            background: inputFocus === 'username' 
                              ? 'linear-gradient(90deg, rgba(21,171,255,0.03) 0%, transparent 100%)' 
                              : 'transparent',
                            paddingLeft: 10,
                            paddingRight: 10
                          }}
                        />
                      </Box>
                      <Box style={{ position: 'relative' }}>
                        <PasswordInput
                          label={
                            <Text size="xs" fw={800} c="gray.6" mb={5}>PASSWORD</Text>
                          }
                          placeholder="Password"
                          variant="unstyled" 
                          size="lg" 
                          radius={0}
                          value={password} 
                          onChange={(e) => setPassword(e.target.value)}
                          onFocus={() => setInputFocus('password')}
                          onBlur={() => setInputFocus(null)}
                          required
                          autoComplete="current-password"
                          style={{ 
                            borderBottom: inputFocus === 'password' 
                              ? '2px solid #15ABFF' 
                              : '2px solid #E9ECEF',
                            transition: 'all 0.3s ease',
                            background: inputFocus === 'password' 
                              ? 'linear-gradient(90deg, rgba(21,171,255,0.03) 0%, transparent 100%)' 
                              : 'transparent',
                            paddingLeft: 10,
                            paddingRight: 10
                          }}
                        />
                        <UnstyledButton 
                          mt={15} 
                          onClick={handlePasswordReset} 
                          style={{ 
                            display: 'block', 
                            marginLeft: 'auto',
                            transition: 'all 0.3s ease',
                            padding: '4px 8px',
                            borderRadius: 4
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateX(3px)';
                            e.currentTarget.style.background = 'rgba(21,171,255,0.1)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateX(0)';
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                            <Text size="xs" fw={800} c="blue">Reset Password</Text>
                        </UnstyledButton>
                      </Box>
                      <Box>
                        <Button 
                          fullWidth 
                          size="xl" 
                          radius={0} 
                          type="submit" 
                          loading={loading} 
                          disabled={!isFormValid}
                          className="auth-button"
                          aria-label="Submit login credentials"
                          style={{ 
                            height: rem(64),
                            background: loading 
                              ? 'linear-gradient(135deg, #15ABFF 0%, #111 100%)'
                              : !isFormValid
                              ? 'linear-gradient(135deg, #E9ECEF 0%, #DEE2E6 100%)'
                              : 'linear-gradient(135deg, #111 0%, #15ABFF 100%)',
                            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: !isFormValid 
                              ? 'none'
                              : '0 10px 30px rgba(21,171,255,0.3)',
                            border: 'none',
                            cursor: !isFormValid ? 'not-allowed' : 'pointer',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                          onMouseEnter={(e) => {
                            if (!loading && isFormValid) {
                              e.currentTarget.style.transform = 'translateY(-2px)';
                              e.currentTarget.style.boxShadow = '0 15px 40px rgba(21,171,255,0.5)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!loading && isFormValid) {
                              e.currentTarget.style.transform = 'translateY(0)';
                              e.currentTarget.style.boxShadow = '0 10px 30px rgba(21,171,255,0.3)';
                            }
                          }}
                        >
                           <Text 
                             fw={900} 
                             lts={2}
                             c={!isFormValid ? 'gray.5' : 'white'}
                           >
                             {loading ? 'AUTHENTICATING...' : 'Login'}
                           </Text>
                        </Button>
                      </Box>
                    </Stack>
                  </form>
                  </Box>
                </Stack>
              </Container>
            )}
          </Transition>
        </Box>
      </Box>

      {/* FOOTER */}
      <Box 
        p="lg" 
        className="footer-container"
        style={{ 
          borderTop: "1px solid #F1F3F5", 
          background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(248,249,250,0.95) 100%)',
          backdropFilter: 'blur(20px)', 
          zIndex: 100,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <Box
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: 'linear-gradient(90deg, transparent 0%, #15ABFF 50%, transparent 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 3s ease-in-out infinite'
          }}
        />
        <Container size="xl">
          <Group justify="center" align="center">
            <Group gap="sm" align="center">
              <Box
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: '#15ABFF',
                  boxShadow: '0 0 10px rgba(21,171,255,0.5)',
                  animation: 'pulse 2s ease-in-out infinite'
                }}
              />
              <Text size="xs" fw={800} c="gray.7" lts={1} style={{ fontFamily: 'monospace' }}>
                PDPM IIITDM <span style={{ color: '#15ABFF' }}>JABALPUR</span>
              </Text>
            </Group>
          </Group>
        </Container>
      </Box>
    </Box>
  );
}

export default LoginPage;