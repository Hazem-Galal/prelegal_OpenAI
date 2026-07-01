type Props = {
  className?: string;
};

export default function Spinner({ className = "" }: Props) {
  return (
    <span
      className={`inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent align-middle ${className}`}
      aria-hidden="true"
    />
  );
}
