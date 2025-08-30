import type { SVGProps } from 'react';

export const Logo = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M12 22c-2 0-4-1-4.5-2.5S9 16 12 16s6.5 1.5 6.5 3.5S14 22 12 22Z" />
    <path d="M12 16V8" />
    <path d="m8 8 4-4 4 4" />
    <path d="M12 4v4" />
  </svg>
);
