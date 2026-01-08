import type { PlankaAuth } from '../types/index.js';

export type ToolResponse = {
  content: Array<{ type: 'text'; text: string }>;
};

export async function requireAuth(args: unknown): Promise<PlankaAuth> {
  const plankaBaseUrl = String((args as any)?.plankaBaseUrl ?? '');
  const plankaToken = String((args as any)?.plankaToken ?? '');
  
  if (!plankaBaseUrl || !plankaToken) {
    throw new Error('plankaBaseUrl and plankaToken are required. Pass Planka credentials directly.');
  }

  return { plankaBaseUrl, accessToken: plankaToken };
}

export function text(t: string): ToolResponse {
  return { content: [{ type: 'text', text: t }] };
}

/**
 * Strip base64-encoded image data from text to reduce response size.
 * Replaces inline base64 images with placeholder text.
 * Example: ![image.png](data:image/png;base64,iVBOR...) → ![image.png][Image data removed - size reduced]
 */
export function stripBase64Images(text: string | null | undefined): string {
  if (!text) return '';
  
  // Match markdown images with base64 data: ![alt](data:image/type;base64,DATA)
  // Replace with placeholder indicating data was removed
  return text.replace(
    /!\[([^\]]*)\]\(data:image\/[^;]+;base64,[^)]+\)/g,
    '![$1][Image data removed - size reduced]'
  );
}

/**
 * Recursively sanitize an object by stripping base64 images from all string fields.
 * Applies to commonly used fields: description, text, content, comments, etc.
 */
export function sanitizeObject(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return stripBase64Images(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        // Apply to text-containing fields
        if (typeof obj[key] === 'string' && 
            (key === 'description' || key === 'text' || key === 'content' || 
             key === 'comment' || key === 'body' || key === 'message')) {
          sanitized[key] = stripBase64Images(obj[key]);
        } else {
          sanitized[key] = sanitizeObject(obj[key]);
        }
      }
    }
    return sanitized;
  }

  return obj;
}
