process.env.JWT_SECRET = process.env.JWT_SECRET ?? "integration-secret-123";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "8h";
process.env.DEFAULT_USER_FULL_NAME = process.env.DEFAULT_USER_FULL_NAME ?? "System Admin";
process.env.DEFAULT_USER_EMAIL = process.env.DEFAULT_USER_EMAIL ?? "admin@hms.local";
process.env.DEFAULT_USER_PASSWORD = process.env.DEFAULT_USER_PASSWORD ?? "admin12345";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";
