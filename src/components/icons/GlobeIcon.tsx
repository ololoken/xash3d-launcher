import { SVGProps } from 'react';

export default (props: SVGProps<SVGSVGElement>) => (
  <svg
    width="1em"
    height="1em"
    fill="none"
    strokeWidth={1.5}
    viewBox="0 0 24 24"
    {...props}
  >
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2 12c0 5.523 4.477 10 10 10s10-4.477 10-10S17.523 2 12 2 2 6.477 2 12z"
    />
    <path
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13 2.05S16 6 16 12c0 6-3 9.95-3 9.95m-2 0S8 18 8 12c0-6 3-9.95 3-9.95M2.63 15.5h18.74m-18.74-7h18.74"
    />
  </svg>
);
