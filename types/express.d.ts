// Exclude global Request/Response that conflict with Express types
declare global {
  interface Request {}
  interface Response {}
}

export {};
