export interface Observer<E, A> {
  next: (value: A) => void;
  error: (err: Cause<E>) => void;
  complete: () => void;
}
