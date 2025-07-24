import { SVGProps } from 'react';

export default (props: SVGProps<SVGSVGElement>) => (
  <svg width="1em" height="1em" fill="none" viewBox="0 0 24 24" {...props}>
    <path
      fill="currentColor"
      d="m5.033 14.828 1.415 1.415L10.69 12 6.448 7.757 5.033 9.172 7.862 12l-2.829 2.828zM15 14h-4v2h4v-2z"
    />
    <path
      fill="currentColor"
      fillRule="evenodd"
      d="M2 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H2zm20 2H2v16h20V4z"
      clipRule="evenodd"
    />
  </svg>
);
