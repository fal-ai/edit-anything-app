import GitHubIcon from "@/components/GitHubIcon";

export default function NavBar() {
  return (
    <div className="navbar bg-base-300">
      <div className="container mx-auto">
        <div className="flex-1">
          <a
            className="text-lg normal-case tracking-wide ps-2 md:ps-0"
            href="#"
          >
            <span className="whitespace-nowrap dark:text-white font-light">
              edit
              <span className="text-secondary font-normal">anything</span>
            </span>
          </a>
          <span className="text-xs whitespace-nowrap dark:text-white font-light ms-1 opacity-40">
            powered by{" "}
            <a
              className="link link-hover hover:opacity-100"
              href="https://docs.fal.ai/fal-serverless/quickstart"
            >
              fal-serverless
            </a>
          </span>
        </div>
        <div className="flex">
          <a
            href="https://github.com/fal-ai/edit-anything-app"
            target="_blank"
            className="opacity-40 hover:opacity-70 dark:opacity-60 dark:hover:opacity-90 transition-opacity duration-200 pe-2 md:pe-0"
          >
            <GitHubIcon />
          </a>
        </div>
      </div>
    </div>
  );
}
