import GitHubIcon from "@/components/GitHubIcon";

export default function Footer() {
  return (
    <footer className="footer footer-center p-4 container mx-auto gap-2 md:gap-4">
      <div className="prose">
        <p>
          Copyright © 2023 - All right reserved -{" "}
          <a href="https://fal.ai" className="link" target="_blank">
            fal.ai
          </a>
        </p>
      </div>
      <div className="prose flex">
        <a
          href="https://twitter.com/fal_ai_data"
          className="opacity-40 hover:opacity-70"
          target="_blank"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            className="fill-current"
          >
            <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"></path>
          </svg>
        </a>
        <a
          href="https://github.com/fal-ai/edit-anything-app"
          className="opacity-40 hover:opacity-70"
          target="_blank"
        >
          <GitHubIcon />
        </a>
      </div>
    </footer>
  );
}
