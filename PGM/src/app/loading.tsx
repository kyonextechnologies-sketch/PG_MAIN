import { Loading } from '@/components/common/Loading';

export default function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loading size="lg" text="Loading page..." />
    </div>
  );
}

