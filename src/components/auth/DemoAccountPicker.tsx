import { useI18n } from "@/i18n";
import { DEMO_PASSWORD, type DemoAccount } from "@/lib/demo-accounts";

/**
 * Demo role chips. Selecting a role fills the sign-in form with a synthetic
 * account so a reviewer can see each view without real credentials.
 */
export function DemoAccountPicker({
  accounts,
  onSelect,
  selected,
}: {
  accounts: DemoAccount[];
  onSelect: (email: string, password: string) => void;
  selected?: string | null;
}) {
  const { t } = useI18n();

  return (
    <section className="mt-8 border-t border-border pt-6">
      <h2 className="text-base font-bold text-primary">{t("app.demo.title")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("app.demo.intro")}</p>

      <ul className="mt-3 flex flex-wrap gap-2">
        {accounts.map((account) => (
          <li key={account.key}>
            <button
              type="button"
              title={account.hint}
              onClick={() => onSelect(account.email, DEMO_PASSWORD)}
              className={`inline-flex min-h-11 items-center rounded-sm border px-3 text-sm font-semibold transition-colors ${
                selected === account.email
                  ? "border-secondary bg-info-soft text-primary"
                  : "border-border-strong bg-surface text-foreground hover:bg-muted"
              }`}
            >
              {account.label}
            </button>
          </li>
        ))}
      </ul>

      {selected ? (
        <p className="mt-3 text-sm font-semibold text-success-foreground">{t("app.demo.filled")}</p>
      ) : null}
    </section>
  );
}
