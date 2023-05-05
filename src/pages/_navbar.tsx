export default function NavBar() {
  return (
    <div className="navbar bg-base-300">
      <div className="container mx-auto">
        <div className="flex-1">
          <a className="text-lg normal-case tracking-wide" href="#">
            <span className="whitespace-nowrap dark:text-white font-light">
              edit
              <span className="text-secondary font-normal">anything</span>
            </span>
          </a>
          <span className="text-xs whitespace-nowrap dark:text-white font-light ms-1 opacity-40">
            powered by{" "}
            <a
              className="link link-hover hover:opacity-100"
              href="https://fal.ai"
            >
              fal.ai
            </a>
          </span>
        </div>
        <div className="flex-none"></div>
      </div>
    </div>
  );
}
