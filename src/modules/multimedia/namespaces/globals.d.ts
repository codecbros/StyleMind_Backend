declare namespace Storage {
  interface MultipartFile {
    buffer: Buffer;
    filename: string;
    size: number;
    mimetype: string;
    fieldname: string;
  }
}

declare module 'fastify' {
  interface FastifyRequest {
    storedFiles: Storage.MultipartFile[];
    body: unknown;
  }
}
