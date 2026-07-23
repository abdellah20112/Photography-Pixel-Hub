/* ============================================
   Storage Error Classes
   Typed errors for precise error handling.
   ============================================ */

/** Base class for all storage errors. */
export class StorageError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number,
  ) {
    super(message);
    this.name = "StorageError";
  }
}

/** Bucket does not exist or is misconfigured. */
export class BucketNotFoundError extends StorageError {
  constructor(bucket: string) {
    super(`Bucket "${bucket}" not found or inaccessible`, "BUCKET_NOT_FOUND", 404);
    this.name = "BucketNotFoundError";
  }
}

/** Access denied — invalid credentials or permissions. */
export class PermissionDeniedError extends StorageError {
  constructor(operation: string) {
    super(`Permission denied for operation: ${operation}`, "PERMISSION_DENIED", 403);
    this.name = "PermissionDeniedError";
  }
}

/** Network failure during storage operation. */
export class NetworkError extends StorageError {
  constructor(message = "Network failure during storage operation") {
    super(message, "NETWORK_ERROR", 503);
    this.name = "NetworkError";
  }
}

/** Upload failed — write operation returned an error. */
export class UploadFailedError extends StorageError {
  constructor(key: string, reason?: string) {
    super(`Upload failed for key "${key}"${reason ? `: ${reason}` : ""}`, "UPLOAD_FAILED", 500);
    this.name = "UploadFailedError";
  }
}

/** Delete failed — object could not be removed. */
export class DeleteFailedError extends StorageError {
  constructor(key: string) {
    super(`Delete failed for key "${key}"`, "DELETE_FAILED", 500);
    this.name = "DeleteFailedError";
  }
}

/** Signed URL has expired or signature is invalid. */
export class ExpiredSignatureError extends StorageError {
  constructor() {
    super("Signed URL has expired", "EXPIRED_SIGNATURE", 410);
    this.name = "ExpiredSignatureError";
  }
}

/** Object not found in storage. */
export class FileNotExistsError extends StorageError {
  constructor(key: string) {
    super(`File not found: ${key}`, "FILE_NOT_EXISTS", 404);
    this.name = "FileNotExistsError";
  }
}

/** File validation failed (type, size, etc.). */
export class FileValidationError extends StorageError {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
    this.name = "FileValidationError";
  }
}

/**
 * Map an unknown SDK error to a typed StorageError.
 * Inspects AWS SDK error names and codes.
 */
export function mapStorageError(error: unknown, context?: string): StorageError {
  if (error instanceof StorageError) return error;

  const err = error as { name?: string; message?: string; $metadata?: { httpStatusCode?: number } };
  const name = err?.name ?? "";
  const message = err?.message ?? "Unknown storage error";
  const statusCode = err?.$metadata?.httpStatusCode;

  if (name === "NoSuchBucket" || statusCode === 404) {
    return new FileNotExistsError(context ?? message);
  }
  if (name === "AccessDenied" || statusCode === 403) {
    return new PermissionDeniedError(context ?? message);
  }
  if (name === "NetworkError" || name === "TimeoutError" || statusCode === 503) {
    return new NetworkError(message);
  }

  return new StorageError(message, "UNKNOWN_ERROR", statusCode);
}
