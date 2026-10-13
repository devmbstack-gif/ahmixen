import { notFound } from 'next/navigation';
import { isContentKey, LANDING_CONTENT_KEYS } from '@/lib/content/registry';
import { ContentEditorClient } from '@/components/admin/content/ContentEditorClient';

type Props = { params: Promise<{ key: string }> };

export async function generateMetadata({ params }: Props) {
  const { key } = await params;
  return { title: `Edit ${key}` };
}

export default async function Page({ params }: Props) {
  const { key } = await params;
  if (!isContentKey(key) || !LANDING_CONTENT_KEYS.includes(key)) {
    notFound();
  }
  return <ContentEditorClient contentKey={key} />;
}
