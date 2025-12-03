export function loadPaypalSdk(clientId: string, currency = 'EUR'): Promise<void> {
  if ((window as any).paypal) return Promise.resolve();

  const existing = document.querySelector<HTMLScriptElement>('script[data-paypal-sdk="true"]');
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Fallo al cargar PayPal SDK')));
      if ((window as any).paypal) resolve();
    });
  }

  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}`;
    s.async = true;
    s.defer = true;
    s.setAttribute('data-paypal-sdk', 'true');

    s.addEventListener('load', () => resolve());
    s.addEventListener('error', () => reject(new Error('Fallo al cargar PayPal SDK')));

    document.head.appendChild(s);
  });
}

