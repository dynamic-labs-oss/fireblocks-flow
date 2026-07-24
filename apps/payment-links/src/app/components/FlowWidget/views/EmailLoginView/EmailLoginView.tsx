'use client';

import type { OTPVerification } from '@dynamic-labs-sdk/client';
import { getCaptchaSettings } from '@dynamic-labs-sdk/client';
import {
  createWaasWalletAccounts,
  getChainsMissingWaasWalletAccounts,
} from '@dynamic-labs-sdk/client/waas';
import { Button, Input, Spinner } from '@dynamic-labs-sdk/droplet';
import {
  useSendEmailOTP,
  useVerifyOTP,
} from '@dynamic-labs-sdk/react-hooks';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import type { FC, FormEvent } from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

import { CaptchaWidget } from './CaptchaWidget';

type EmailLoginViewProps = {
  onBack: () => void;
  onLoggedIn: () => void;
};

export const EmailLoginView: FC<EmailLoginViewProps> = ({
  onBack,
  onLoggedIn,
}) => {
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isCreatingWallets, setIsCreatingWallets] = useState(false);
  const [otpVerification, setOtpVerification] =
    useState<OTPVerification | null>(null);
  const [captchaSolved, setCaptchaSolved] = useState(false);
  const captchaRequired = !!getCaptchaSettings();

  const createWalletsAndProceed = async () => {
    setIsCreatingWallets(true);

    try {
      const missingChains = getChainsMissingWaasWalletAccounts();

      if (missingChains.length > 0) {
        await createWaasWalletAccounts({ chains: missingChains });
      }

      onLoggedIn();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : 'Failed to create wallets. Please try again.',
      );
    } finally {
      setIsCreatingWallets(false);
    }
  };

  const { mutate: sendOtp, isPending: isSending } = useSendEmailOTP({
    mutateParams: {
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Failed to send verification code.',
        );
      },
      onSuccess: (verification) => {
        setOtpVerification(verification);
      },
    },
  });

  const { mutate: verifyOtp, isPending: isVerifying } = useVerifyOTP({
    mutateParams: {
      onError: (error) => {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Invalid code. Please try again.',
        );
      },
      onSuccess: () => {
        void createWalletsAndProceed();
      },
    },
  });

  const handleSendOtp = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();

    if (!trimmed) return;

    sendOtp({ email: trimmed });
  };

  const handleVerifyOtp = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = otpCode.trim();

    if (!trimmed || !otpVerification) return;

    verifyOtp({
      otpVerification,
      verificationToken: trimmed,
    });
  };

  if (isCreatingWallets) {
    return (
      <div className="px-5 py-12 flex flex-col items-center gap-3">
        <Spinner className="size-6 text-[var(--action)]" />
        <p className="text-sm text-muted-foreground">Creating your wallets…</p>
      </div>
    );
  }

  if (otpVerification) {
    return (
      <div>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-border-default">
          <button
            onClick={() => setOtpVerification(null)}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
            aria-label="Go back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-base font-semibold tracking-[-0.01em]">Enter verification code</h3>
            <p className="text-xs text-muted-foreground">
              We sent a code to{' '}
              <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleVerifyOtp} className="px-5 py-5 space-y-3">
          <Input
            placeholder="Enter code"
            value={otpCode}
            onChange={(e) => setOtpCode(e.target.value)}
            disabled={isVerifying}
            autoFocus
            className="font-mono text-sm text-center tracking-widest"
          />
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={!otpCode.trim() || isVerifying}
          >
            {isVerifying ? <Spinner className="size-4" /> : <ArrowRight className="w-4 h-4" />}
            {isVerifying ? 'Verifying…' : 'Verify'}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 px-5 py-5 border-b border-border-default">
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          aria-label="Go back"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex flex-col gap-0.5">
          <h3 className="text-base font-semibold tracking-[-0.01em]">Log in with email</h3>
          <p className="text-xs text-muted-foreground">Enter your email to use an embedded wallet</p>
        </div>
      </div>

      <form onSubmit={handleSendOtp} className="px-5 py-5 space-y-3">
        <div className="space-y-1.5">
          <label className="text-sm font-medium" htmlFor="email">
            Email address
          </label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isSending}
            autoFocus
          />
        </div>
        {captchaRequired && (
          <CaptchaWidget onSolved={() => setCaptchaSolved(true)} />
        )}
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={!email.trim() || isSending || (captchaRequired && !captchaSolved)}
        >
          {isSending ? <Spinner className="size-4" /> : <ArrowRight className="w-4 h-4" />}
          {isSending ? 'Sending code…' : 'Continue'}
        </Button>
      </form>
    </div>
  );
};
