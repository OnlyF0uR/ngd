import { useRef, type ReactNode } from 'react';
import { Link, NavLink, useNavigation } from 'react-router';
import { panel } from '~/lib/panel';
import { Icon } from '../Icon';
import styles from './AppShell.module.css';

type ShellUser = { name: string; email: string; role: string };

/**
 * The panel frame: sidebar on wide screens, top bar with a popover menu on narrow ones, and a slim
 * progress bar while a navigation is pending, so the previous screen stays visible instead of blanking.
 */
export function AppShell({ user, children }: { user: ShellUser; children: ReactNode }) {
  const navigation = useNavigation();
  const busy = navigation.state !== 'idle';
  const menuRef = useRef<HTMLDivElement>(null);
  const closeMenu = () => menuRef.current?.hidePopover?.();

  const navItems = (onNavigate?: () => void) =>
    panel.nav.map((item) => (
      <li key={item.href}>
        <NavLink to={item.href} end={item.end} prefetch="intent" className={styles.navLink} onClick={onNavigate}>
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </NavLink>
      </li>
    ));

  return (
    <div className={styles.shell}>
      <a href="#main" className="visually-hidden">
        {panel.ui.skipToContent}
      </a>

      <aside className={styles.sidebar}>
        <Link to={panel.home} className={styles.brand}>
          {panel.name}
        </Link>
        <nav aria-label={panel.ui.panelNav}>
          <ul role="list" className={styles.navList}>
            {navItems()}
          </ul>
        </nav>
        <UserCard user={user} />
      </aside>

      <div className={styles.column}>
        <header className={styles.topbar}>
          <button type="button" className={styles.iconButton} popoverTarget="panel-menu" aria-label={panel.ui.openMenu}>
            <Icon name="menu" />
          </button>
          <Link to={panel.home} className={styles.topBrand}>
            {panel.name}
          </Link>
          <span className={styles.spacer} />
          <ThemeToggle />
          <span className={styles.progress} data-active={busy} aria-hidden="true" />
        </header>

        <div id="panel-menu" popover="auto" ref={menuRef} className={styles.sheet}>
          <button type="button" className={styles.iconButton} popoverTarget="panel-menu" popoverTargetAction="hide" aria-label={panel.ui.closeMenu}>
            <Icon name="close" />
          </button>
          <nav aria-label={panel.ui.panelNav}>
            <ul role="list" className={styles.navList}>
              {navItems(closeMenu)}
            </ul>
          </nav>
          <UserCard user={user} />
        </div>

        <main id="main" className={styles.main} aria-busy={busy || undefined}>
          {children}
        </main>
      </div>
    </div>
  );
}

function UserCard({ user }: { user: ShellUser }) {
  // Add a sign-out control here once authentication is in place.
  return (
    <div className={styles.user}>
      <span className={styles.avatar} aria-hidden="true">
        {user.name.slice(0, 1)}
      </span>
      <span className={styles.userText}>
        <strong>{user.name}</strong>
        <small>{user.role}</small>
      </span>
    </div>
  );
}

/** Flips light/dark and remembers it; root.tsx applies the saved choice before first paint. */
function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const current = root.dataset.theme ?? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    root.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {}
  };
  return (
    <button type="button" className={styles.iconButton} onClick={toggle} aria-label={panel.ui.toggleTheme} title={panel.ui.toggleTheme}>
      <Icon name="contrast" />
    </button>
  );
}
