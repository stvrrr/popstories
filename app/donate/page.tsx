import type { Metadata } from "next";
import DonationPanel from "./donation-panel";
import styles from "./donation.module.css";

export const metadata: Metadata = {
  title: "Support Flip Stories",
  description: "Support Flip Stories with a Litecoin donation sent directly to the creator's wallet."
};

export default function DonatePage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href="/" aria-label="Flip Stories home">
          <span className={styles.brandMark}>f.</span>
          <span>Flip Stories</span>
        </a>
        <a className={styles.backLink} href="/">
          <span aria-hidden="true">←</span> Back to stories
        </a>
      </header>

      <div className={styles.content}>
        <section className={styles.intro}>
          <p className={styles.eyebrow}><span /> A little support goes a long way</p>
          <h1>Help keep the <em>stories</em> coming.</h1>
          <p className={styles.description}>
            If you enjoy reading here, you can leave a tip in Litecoin. Every
            donation goes straight to the creator&apos;s Trust Wallet.
          </p>
          <div className={styles.directNote}>
            <span className={styles.noteIcon}>↗</span>
            <p><strong>Direct, wallet to wallet.</strong><br />No payment processor in between.</p>
          </div>
          <div className={styles.safetyNote}>
            <span aria-hidden="true">✳</span>
            <p>Only send Litecoin on the Litecoin network. Never share your recovery phrase.</p>
          </div>
        </section>

        <DonationPanel address={process.env.NEXT_PUBLIC_LITECOIN_ADDRESS?.trim() ?? ""} />
      </div>

      <footer className={styles.footer}>
        <span>Thank you for supporting independent storytelling.</span>
        <span>Litecoin · Litecoin network</span>
      </footer>
    </main>
  );
}
