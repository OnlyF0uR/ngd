import { createFileRoute } from '@tanstack/react-router';
import { seo } from '~/lib/seo';
import { site } from '~/lib/site';
import styles from './legal.module.css';

// PLACEHOLDER: replace with the business's real privacy policy before launch (the NGD audit fails while
// data-ngd-placeholder is present). Never invent legal text: ask the user for it or for their provider.
export const Route = createFileRoute('/_site/privacy')({
  head: () => seo({ title: `Privacy policy | ${site.name}`, description: `How ${site.legalName} collects, uses and protects your personal data, and which rights you have.`, path: '/privacy' }),
  component: () => (
    <article className={styles.page} data-ngd-placeholder>
      <h1>Privacy policy</h1>
      <p>The privacy policy of {site.legalName} will be published here.</p>
    </article>
  ),
});
