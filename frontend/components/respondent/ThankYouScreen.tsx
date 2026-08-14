export function ThankYouScreen({ message }: { message: string | null }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-fg text-2xl text-white">
        ✓
      </div>
      <h1 className="question-title max-w-xl">{message || "Thanks for completing this form!"}</h1>
    </div>
  );
}
