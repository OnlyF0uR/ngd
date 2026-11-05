import { createFileRoute } from '@tanstack/react-router';
import { seo } from '~/lib/seo';
import { site } from '~/lib/site';
import styles from './legal.module.css';

// PLACEHOLDER: replace with the business's real terms and conditions before launch (the NGD audit fails while
// data-ngd-placeholder is present). Never invent legal text: ask the user for it or for their provider.
export const Route = createFileRoute('/_site/terms')({
  head: () =>
    seo({ title: `Terms and conditions | ${site.name}`, description: `The terms and conditions that apply when you use the website and services of ${site.legalName}.`, path: '/terms' }),
  component: () => (
    <article className={styles.page} data-ngd-placeholder>
      <h1>Terms and conditions</h1>
      <p>The terms and conditions of {site.legalName} will be published here.</p>
    </article>
  ),
});
