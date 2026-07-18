/* ============================================
   Authentication & Authorization Errors
   Custom error classes for granular handling.
   ============================================ */

/** Base error for all auth-related failures. */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/** Thrown when email/password combination is invalid. */
export class InvalidCredentialsError extends AuthError {
  constructor(message = "البريد الإلكتروني أو كلمة المرور غير صحيحة") {
    super(message, "INVALID_CREDENTIALS");
    this.name = "InvalidCredentialsError";
  }
}

/** Thrown when no session exists or the user is not authenticated. */
export class UnauthorizedError extends AuthError {
  constructor(message = "يجب تسجيل الدخول للوصول إلى هذه الصفحة") {
    super(message, "UNAUTHORIZED");
    this.name = "UnauthorizedError";
  }
}

/** Thrown when the authenticated user lacks the required role. */
export class ForbiddenError extends AuthError {
  constructor(message = "ليس لديك صلاحية للوصول إلى هذه الصفحة") {
    super(message, "FORBIDDEN");
    this.name = "ForbiddenError";
  }
}

/** Thrown when a session token has expired or is otherwise invalid. */
export class ExpiredSessionError extends AuthError {
  constructor(message = "انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى") {
    super(message, "EXPIRED_SESSION");
    this.name = "ExpiredSessionError";
  }
}

/** Thrown when too many login attempts have been made. */
export class RateLimitExceededError extends AuthError {
  constructor(message = "تم تجاوز عدد محاولات تسجيل الدخول المسموح بها") {
    super(message, "RATE_LIMIT_EXCEEDED");
    this.name = "RateLimitExceededError";
  }
}
