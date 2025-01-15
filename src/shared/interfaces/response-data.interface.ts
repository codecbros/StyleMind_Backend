export interface ResponseDataInterface<T> {
  success?: boolean;
  data?: T;
  message: string;
}
