import { useLang } from "@/i18n";
import { skills } from "@/data/skills";
import SyncBar from "@/components/ui/SyncBar";

const LEARNING_BELOW = 50;

export default function SkillsWin() {
  const { t } = useLang();
  return (
    <div className="grid gap-x-6 gap-y-5 @xl:grid-cols-2">
      {skills.map((g) => (
        <div key={g.id} className="min-w-0">
          <h3 className="om-accent mb-2 font-mono text-[10px] tracking-[0.3em]">{t.skills.groups[g.id]}</h3>
          <div className="grid gap-2.5">
            {g.items.map((it) => (
              <SyncBar
                key={it.name}
                name={it.name}
                sync={it.sync}
                tag={it.sync < LEARNING_BELOW ? t.skills.learning : undefined}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
