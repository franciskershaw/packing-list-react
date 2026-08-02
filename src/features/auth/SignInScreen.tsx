import illustration from "../../assets/landing-illustration.svg";
import { Button } from "../../components/ui/Button";
import { GoogleIcon } from "../../components/ui/GoogleIcon";
import { useDocumentTitle } from "../../lib/useDocumentTitle";

export function SignInScreen() {
  useDocumentTitle("Sign In");

  return (
    <div className="flex min-h-screen flex-col bg-bg lg:flex-row-reverse">
      <div className="relative flex h-64 shrink-0 items-center justify-center overflow-hidden sm:h-80 lg:h-auto lg:flex-1 lg:p-12">
        <img
          src={illustration}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-bottom lg:static lg:h-auto lg:max-h-full lg:w-full lg:object-contain"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between gap-10 px-6 py-10 sm:px-12 lg:w-1/2 lg:flex-none lg:justify-center lg:gap-8 lg:px-24 lg:py-0">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            <h1 className="font-heading text-4xl leading-tight font-bold text-heading sm:text-5xl">
              Never forget the sun cream again.
            </h1>
            <p className="max-w-sm text-lg text-body">
              Build templates once, pack in minutes, and enjoy the big tick-off.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center gap-3 lg:w-fit">
          <Button
            icon={<GoogleIcon />}
            onClick={() => {
              window.location.href = `${import.meta.env.VITE_API_URL}/auth/google/login`;
            }}
            className="w-full max-w-sm sm:w-auto"
          >
            Continue with Google
          </Button>
          <p className="text-sm text-muted">One tap. No passwords, ever.</p>
        </div>
      </div>
    </div>
  );
}
