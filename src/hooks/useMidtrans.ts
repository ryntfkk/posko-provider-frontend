import { useEffect, useState } from 'react';

const useMidtrans = () => {
  const [isSnapLoaded, setIsSnapLoaded] = useState(false);

  useEffect(() => {
    const midtransScriptUrl = 'https://app.sandbox.midtrans.com/snap/snap.js';
    // Ganti client key di bawah dengan env variable Anda
    const myClientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ''; 

    let scriptTag = document.createElement('script');
    scriptTag.src = midtransScriptUrl;
    scriptTag.setAttribute('data-client-key', myClientKey);
    scriptTag.onload = () => {
        setIsSnapLoaded(true);
    };

    document.body.appendChild(scriptTag);

    return () => {
      document.body.removeChild(scriptTag);
    };
  }, []);

  return isSnapLoaded;
};

export default useMidtrans;