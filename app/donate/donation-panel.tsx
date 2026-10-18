"use client";

import { useEffect, useState } from "react";
import { Check, Copy, QrCode, Wallet } from "lucide-react";
import QRCode from "qrcode";
import styles from "./donation.module.css";

const presetAmounts = ["0.01", "0.025", "0.05", "0.1"];

export default function DonationPanel({ address }: { address: string }) {
  const [amount, setAmount] = useState(presetAmounts[1]);
  const [qrImage, setQrImage] = useState("");
  const [qrError, setQrError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const validAmount = /^\d+(\.\d{1,8})?$/.test(amount) && Number(amount) > 0;
  const paymentUri = address && validAmount
    ? `litecoin:${address}?amount=${encodeURIComponent(amount)}`
    : "";

  useEffect(() => {
    if (!paymentUri) {
      setQrImage("");
      setQrError("");
      return;
    }

    let cancelled = false;
    setQrImage("");
    setQrError("");
    QRCode.toDataURL(paymentUri, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 220,
      color: { dark: "#2b211d", light: "#fffaf7" },
    })
      .then((image) => {
        if (!cancelled) {
          setQrImage(image);
          setQrError("");
        }
      })
      .catch((error: unknown) => {
        console.error("Could not create the Litecoin donation QR code.", error);
        if (!cancelled) {
          setQrImage("");
          setQrError("The QR code could not be created. You can still copy the address below.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [paymentUri]);

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(address);
      setActionMessage("Litecoin address copied.");
    } catch (error) {
      console.error("Could not copy the Litecoin address.", error);
      setActionMessage("Copy failed. Please select and copy the address above.");
    }
  }

  return (
    <section className={styles.card} aria-labelledby="donation-title">
      <div className={styles.cardHeading}>
        <span className={styles.litecoinMark} aria-hidden="true">Ł</span>
        <div>
          <h2 className={styles.cardTitle} id="donation-title">Send a Litecoin tip</h2>
          <span className={styles.networkBadge}>LTC · Litecoin network</span>
        </div>
      </div>

      <fieldset className={styles.amountLabel}>
        <legend>Choose an amount</legend>
        <div className={styles.amountOptions}>
          {presetAmounts.map((preset) => (
            <button
              className={`${styles.amountOption} ${amount === preset ? styles.amountOptionSelected : ""}`}
              key={preset}
              type="button"
              onClick={() => {
                setAmount(preset);
                setActionMessage("");
              }}
              aria-pressed={amount === preset}
            >
              {preset}
            </button>
          ))}
        </div>
      </fieldset>

      <label className={styles.customAmount}>
        Or enter any amount
        <span className={styles.amountInput}>
          <input
            aria-label="Donation amount in Litecoin"
            inputMode="decimal"
            min="0.00000001"
            max="84000000"
            onChange={(event) => {
              setAmount(event.target.value);
              setActionMessage("");
            }}
            placeholder="0.00"
            step="0.00000001"
            type="number"
            value={amount}
          />
          <span className={styles.currencySuffix}>LTC</span>
        </span>
      </label>

      <div className={styles.qrSection}>
        <div className={styles.qrFrame}>
          {qrImage ? (
            <img className={styles.qrImage} src={qrImage} alt={`QR code for a ${amount} LTC donation`} />
          ) : (
            <div className={styles.qrPlaceholder}>
              <QrCode size={38} strokeWidth={1.4} aria-hidden="true" />
              <span>{address ? "Enter a valid amount to create your QR code" : "Your QR code will appear here"}</span>
            </div>
          )}
        </div>
        <p className={styles.qrCaption}>
          {address && validAmount ? `Scan to send ${amount} LTC` : "Scan with a Litecoin-compatible wallet"}
        </p>
      </div>

      <div className={styles.addressLabel}>
        <span>Litecoin receive address</span>
        <span className={styles.addressBox}>
          <code className={styles.addressValue}>
            {address || "Your Trust Wallet address will appear here"}
          </code>
          <button
            className={styles.copyButton}
            disabled={!address}
            onClick={() => void copyAddress()}
            type="button"
            aria-label="Copy Litecoin address"
          >
            {actionMessage === "Litecoin address copied." ? <Check size={16} /> : <Copy size={16} />}
          </button>
        </span>
      </div>

      {address ? (
        paymentUri ? (
          <a className={styles.walletButton} href={paymentUri}>
            <Wallet size={16} aria-hidden="true" /> Open in wallet
          </a>
        ) : (
          <button className={styles.walletButton} disabled type="button">
            <Wallet size={16} aria-hidden="true" /> Enter a valid LTC amount
          </button>
        )
      ) : (
        <button className={styles.walletButton} disabled type="button">
          <Wallet size={16} aria-hidden="true" /> Add wallet address to enable donations
        </button>
      )}

      {!address && (
        <p className={styles.setupMessage}>
          Preview mode — set <code>NEXT_PUBLIC_LITECOIN_ADDRESS</code> to your Litecoin receive address to activate donations.
        </p>
      )}
      {qrError && <p className={styles.actionMessage} role="alert">{qrError}</p>}
      {actionMessage && <p className={styles.actionMessage} role="status">{actionMessage}</p>}
    </section>
  );
}
