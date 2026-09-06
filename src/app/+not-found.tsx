import { useRouter } from 'expo-router';

import { AppHeader } from '@/components/AppHeader';
import { Screen } from '@/components/Screen';
import { StateView } from '@/components/StateView';

export default function NotFoundScreen() {
  const router = useRouter();
  return (
    <Screen edges={['top', 'bottom']}>
      <AppHeader title="Apex" backLabel="Back" onBack={() => router.replace('/')} />
      <StateView
        title={'Nothing\nfiled here'}
        message="That link does not point anywhere in the archive."
        actionLabel="Go to the archive"
        onAction={() => router.replace('/')}
        testID="not-found"
      />
    </Screen>
  );
}
