'use client';

import {
  CaptchaProviderEnum,
  getCaptchaSettings,
  setCaptchaToken,
} from '@dynamic-labs-sdk/client';
import HCaptcha from '@hcaptcha/react-hcaptcha';
import { Turnstile } from '@marsidev/react-turnstile';
import type { FC } from 'react';
import { useRef } from 'react';

type CaptchaWidgetProps = {
  onSolved: () => void;
};

export const CaptchaWidget: FC<CaptchaWidgetProps> = ({ onSolved }) => {
  const hcaptchaRef = useRef<HCaptcha>(null);
  const settings = getCaptchaSettings();

  if (!settings?.siteKey) return null;

  const handleToken = (token: string) => {
    setCaptchaToken({ captchaToken: token });
    onSolved();
  };

  if (settings.provider === CaptchaProviderEnum.CloudflareTurnstile) {
    return (
      <Turnstile
        siteKey={settings.siteKey}
        onSuccess={handleToken}
        options={{ theme: 'light' }}
      />
    );
  }

  if (settings.provider === CaptchaProviderEnum.Hcaptcha) {
    return (
      <HCaptcha
        ref={hcaptchaRef}
        sitekey={settings.siteKey}
        onVerify={handleToken}
        theme="light"
      />
    );
  }

  return null;
};
