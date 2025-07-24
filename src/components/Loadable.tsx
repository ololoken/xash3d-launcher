import Loader from './Loader';
import { ElementType, Suspense } from 'react';

export default (Component: ElementType) => (props: any) => (
  <Suspense fallback={<Loader />}>
    <Component {...props} />
  </Suspense>
);
