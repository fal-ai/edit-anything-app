import { Head, Html, Main, NextScript } from "next/document";
import NavBar from "./_navbar";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className="theme bg-base-300">
        <NavBar />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
