import { useLang } from "@/i18n";
import { skills, type SkillGroup } from "@/data/skills";
import SyncBar, { type SyncColor } from "@/components/ui/SyncBar";

const GROUP_COLOR: Record<SkillGroup["id"], SyncColor> = {
  cloud: "alert",
  languages: "phosphor",
  linux: "unit",
  ai: "amber",
};
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
                color={GROUP_COLOR[g.id]}
                tag={it.sync < LEARNING_BELOW ? t.skills.learning : undefined}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
