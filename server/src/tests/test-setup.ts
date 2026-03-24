process.env.JWT_SECRET = process.env.JWT_SECRET ?? "integration-secret-123";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "8h";
process.env.DEFAULT_SUPER_ADMIN_USERNAME = process.env.DEFAULT_SUPER_ADMIN_USERNAME ?? "admin";
process.env.DEFAULT_SUPER_ADMIN_PASSWORD =
  process.env.DEFAULT_SUPER_ADMIN_PASSWORD ?? "admin12345";
process.env.DEFAULT_STAFF_USERNAME = process.env.DEFAULT_STAFF_USERNAME ?? "staff";
process.env.DEFAULT_STAFF_PASSWORD = process.env.DEFAULT_STAFF_PASSWORD ?? "staff12345";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";
