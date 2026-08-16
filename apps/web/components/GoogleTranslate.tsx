"use client";
import Script from "next/script";
import { useEffect } from "react";

export default function GoogleTranslate() {
  useEffect(() => {
    // Add custom styles to hide the default Google Translate banner and widget
    const style = document.createElement("style");
    style.innerHTML = `
      .skiptranslate iframe {
        display: none !important;
      }
      body {
        top: 0 !important;
      }
      .goog-te-gadget {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <>
      <div id="google_translate_element" style={{ display: "none" }}></div>
      <Script
        src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        strategy="afterInteractive"
      />
      <Script id="google-translate-init" strategy="afterInteractive">
        {`
          function googleTranslateElementInit() {
            new google.translate.TranslateElement(
              { pageLanguage: 'fr', autoDisplay: false },
              'google_translate_element'
            );
          }
        `}
      </Script>
    </>
  );
}
