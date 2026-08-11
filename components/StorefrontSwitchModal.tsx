'use client';

import React from 'react';
import styles from './StorefrontSwitchModal.module.css';

interface StorefrontSwitchModalProps {
  open: boolean;
  canHaveBoth: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

/**
 * Shared confirmation modal for switching from link-in-bio mode to a full
 * storefront. On Pro/Enterprise plans the store is created as a *separate*
 * page that runs alongside the existing link-in-bio; on other plans the
 * link-in-bio is replaced by the store.
 */
export function StorefrontSwitchModal({ open, canHaveBoth, onClose, onConfirm }: StorefrontSwitchModalProps) {
  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <h3 className={styles.title}>{canHaveBoth ? 'Create a separate store?' : 'Switch to a store?'}</h3>
        <p className={styles.body}>
          {canHaveBoth
            ? "You're creating a full storefront as a separate page alongside your link-in-bio. Your plan keeps both active at the same time — your link-in-bio keeps its URL and your store gets its own page."
            : "You're switching your page from link-in-bio to a full store. Your current plan doesn't support having both at the same time, so your link-in-bio will be replaced by the store."}
        </p>
        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.confirmBtn} onClick={onConfirm}>
            {canHaveBoth ? 'Create Store' : 'Switch to Store'}
          </button>
        </div>
      </div>
    </div>
  );
}
