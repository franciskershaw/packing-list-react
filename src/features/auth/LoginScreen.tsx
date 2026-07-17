export function LoginScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-6">
      <div className="flex w-full flex-col items-center gap-4 text-center md:max-w-115">
        <a
          href="/api/auth/google/login"
          className="rounded-full bg-accent px-5 py-2.5 font-body font-bold text-on-accent hover:bg-accent-hover"
        >
          Continue with Google
        </a>
        <p className="font-body text-sm text-secondary">
          One tap. No passwords, ever.
        </p>
      </div>
    </div>
  );
}
