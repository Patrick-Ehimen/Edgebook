import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { ZodSchema } from 'zod';

@Injectable()
export class ZodValidationPipe implements PipeTransform {
  constructor(private readonly schema: ZodSchema) {}

  transform(value: unknown) {
    const result = this.schema.safeParse(value);
    if (!result.success) {
      const flat = result.error.flatten();
      const msgs = [
        ...flat.formErrors,
        ...Object.entries(flat.fieldErrors).map(
          ([field, errs]) => `${field}: ${(errs ?? []).join(', ')}`,
        ),
      ].filter(Boolean);
      throw new BadRequestException(msgs.join(' · ') || 'Validation failed.');
    }
    return result.data;
  }
}
