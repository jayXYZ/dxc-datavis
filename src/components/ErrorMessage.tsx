import { AlertCircle } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
}

export function ErrorMessage({ message }: ErrorMessageProps) {
  return (
    <div className="flex items-center gap-2 p-4 text-red-500 bg-red-50 rounded-md">
      <AlertCircle className="h-5 w-5" />
      <p>{message}</p>
    </div>
  );
}
