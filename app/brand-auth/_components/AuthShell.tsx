import React from 'react';
import { CheckCircle2, Film, Megaphone, Wallet } from 'lucide-react';
import styles from '../brand-auth.module.css';

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  steps?: number;
  currentStep?: number;
};

const FEATURES = [
  { icon: Megaphone, text: 'Send briefs and manage collaborations' },
  { icon: Film, text: 'Review and buy creator videos' },
  { icon: Wallet, text: 'Track spend, payouts and disputes' },
  { icon: CheckCircle2, text: 'Approve drafts before final payment' },
];

export function AuthShell({ eyebrow, title, description, children, footer, steps, currentStep }: AuthShellProps) {
  return (
    <div className={styles.page}>
      <div className={styles.grid} aria-hidden="true" />

      <div className={styles.formSide}>
        <div className={styles.formCard}>
          <div className={styles.brandRow}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://res.cloudinary.com/dzjoqbg2u/image/upload/v1785078071/mosell_gpzl2q.png"
              alt="MO Sell"
              className={styles.logo}
            />
            <span className={styles.brandDivider} aria-hidden="true" />
            <span className={styles.brandLabel}>
              <span className={styles.brandName}>MO Sell</span>
              <span className={styles.brandTag}>Brand Studio</span>
            </span>
          </div>

          {steps ? (
            <div className={styles.steps} aria-label={`Step ${currentStep} of ${steps}`}>
              {Array.from({ length: steps }).map((_, index) => (
                <span
                  key={index}
                  className={`${styles.step} ${index < (currentStep ?? 1) ? styles.stepActive : ''}`}
                />
              ))}
            </div>
          ) : null}

          <div className={styles.eyebrow}>
            <span className={styles.eyebrowDot} /> {eyebrow}
          </div>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.description}>{description}</p>

          {children}
          {footer}
        </div>
      </div>

      <aside className={styles.showcase}>
        <div className={styles.showcaseInner}>
          <div className={styles.showcaseBadge}>For modern brands</div>
          <h2 className={styles.showcaseTitle}>Creator content, without the chaos.</h2>
          <p className={styles.showcaseText}>
            One calm workspace for briefs, reviews, video licensing and payouts — built for teams who move fast.
          </p>
          <div className={styles.featureList}>
            {FEATURES.map(({ icon: Icon, text }) => (
              <div className={styles.featureItem} key={text}>
                <span className={styles.featureIcon}><Icon size={17} /></span>
                <span className={styles.featureText}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
