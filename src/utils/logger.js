const enableClientLogs = import.meta.env.DEV;

const SENSITIVE_KEYS = ["password", "token", "secret", "authorization", "cookie", "apikey", "api_key"];

const isSensitiveKey = (key) => {
  const normalized = String(key || "").toLowerCase();
  return SENSITIVE_KEYS.some((sensitive) => normalized.includes(sensitive));
};

const sanitizeArg = (arg, depth = 0) => {
  if (depth > 3 || arg == null) {
    return arg;
  }

  if (Array.isArray(arg)) {
    return arg.map((item) => sanitizeArg(item, depth + 1));
  }

  if (typeof arg === "object") {
    const safeObject = {};
    Object.entries(arg).forEach(([key, value]) => {
      safeObject[key] = isSensitiveKey(key) ? "[REDACTED]" : sanitizeArg(value, depth + 1);
    });
    return safeObject;
  }

  return arg;
};

const toSafeArg = (arg) => {
  if (arg instanceof Error) {
    return {
      name: arg.name,
      message: arg.message,
      stack: import.meta.env.DEV ? arg.stack : undefined,
    };
  }
  return sanitizeArg(arg);
};

const emit = (method, message, ...meta) => {
  if (!enableClientLogs) {
    return;
  }

  const safeMeta = meta.map(toSafeArg);
  const fn = console[method] || console.log;
  fn(`[APP] ${message}`, ...safeMeta);
};

const logger = {
  debug: (message, ...meta) => emit("debug", message, ...meta),
  info: (message, ...meta) => emit("info", message, ...meta),
  warn: (message, ...meta) => emit("warn", message, ...meta),
  error: (message, ...meta) => emit("error", message, ...meta),
};

export default logger;
