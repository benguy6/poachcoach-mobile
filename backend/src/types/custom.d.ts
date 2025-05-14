// src/types/custom.d.ts
import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      id: string;
      email: string;
      username?: string;
    };
  }
}
