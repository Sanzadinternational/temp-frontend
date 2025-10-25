'use client';
import { useEffect } from 'react';

export default function PaymentResponseHandler() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const encResp = urlParams.get('encResp');

    if (!encResp) return;

    const formData = new FormData();
    formData.append('encResp', encResp);

    fetch('https://api.sanzadinternational.in/api/V1/payment/payment-status-update', {
      method: 'POST',
      body: formData,
    })
      .then((res) => {
        if (!res.ok) throw new Error('Payment status update failed');
        return res.json();
      })
      .then((data) => {
        if (data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          window.location.href = '/thank-you';
        }
      })
      .catch((err) => {
        console.error(err);
        window.location.href = '/payment-failed';
      });
  }, []);

  return <p>Processing payment response...</p>;
}
