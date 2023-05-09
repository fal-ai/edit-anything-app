import { Head, Html, Main, NextScript } from "next/document";
import NavBar from "./_navbar";
import GithubCorner from "./_github_corner";

export default function Document() {
  return (
    <Html lang="en">
      <Head />
      <body className="theme bg-base-300">
        <NavBar />
        <GithubCorner url="//github.com/fal-ai/edit-anything-app" />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
