import type { Route } from './+types/home';
import { seo, organizationJsonLd, websiteJsonLd } from '~/lib/seo';
import { site } from '~/lib/site';
import { Button } from '~/components/ui/Button/Button';
import { Reveal } from '~/components/motion/Reveal/Reveal';
import { LeadForm } from '~/components/forms/LeadForm';
import styles from './home.module.css';

// Example page: replace the copy and sections with the chosen preset's design.
export const meta: Route.MetaFunction = () =>
  seo({
    title: `Outcome-focused headline for the audience | ${site.name}`,
    description: site.description,
    path: '/',
    jsonLd: [organizationJsonLd(), websiteJsonLd()],
  });

const benefits = [
  { title: 'Specific benefit one', text: 'What the visitor gets, in their words, with a concrete detail.' },
  { title: 'Specific benefit two', text: 'Address the objection people have at this point in the page.' },
  { title: 'Specific benefit three', text: 'Proof that it works: a number, a name, a result.' },
];

export default function Home() {
  return (
    <>
      <section className={styles.hero}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Who it's for · where</p>
          <h1 className={styles.title}>The outcome your customer wants, said plainly</h1>
        </div>
        <div className={styles.heroFoot}>
          <p className={styles.lead}>How you deliver it and what makes you different, in one or two sentences.</p>
          <div className={styles.heroActions}>
            <div className={styles.actions}>
              <Button to="/contact" size="lg" arrow>
                {site.primaryCta.label}
              </Button>
              <Button to="/#services" variant="secondary" size="lg">
                See how it works
              </Button>
            </div>
            <p className={styles.proof}>★★★★★ 4.9 on Google · 200+ reviews</p>
          </div>
        </div>
      </section>

      <section id="services" className={styles.section}>
        <h2 className={styles.heading}>Three reasons people choose us</h2>
        <ol role="list" className={styles.list}>
          {benefits.map((benefit, i) => (
            <li key={benefit.title}>
              <Reveal delay={i * 60} className={styles.item}>
                <h3>{benefit.title}</h3>
                <p>{benefit.text}</p>
              </Reveal>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.cta} data-theme="dark">
        <h2 className={styles.heading}>Ready when you are</h2>
        <LeadForm />
      </section>
    </>
  );
}
